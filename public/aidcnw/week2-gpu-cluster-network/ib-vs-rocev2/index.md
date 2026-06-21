# InfiniBand vs RoCEv2: 같은 RDMA, 다른 길

1주차에서 RDMA를 'RNIC가 상대 메모리에 직접 읽고 쓴다'는 개념으로 봤고, [패킷 구조와 verbs](../../week1-ai-model-lifecycle/rdma-hands-on/)도 한 겹 벗겨봤다. 2주차는 그 RDMA를 실제로 어떤 네트워크에 실어 나르느냐를 IB와 RoCEv2로 갈라 비교한 회차였다. 스터디 자료가 2003년 Mellanox의 InfiniBand 소개 백서부터 교재의 RoCE 장까지 따라가서, IB가 왜 케이블이 아니라 아키텍처인지, 그리고 RoCEv2가 그걸 이더넷 위로 어떻게 옮겼는지를 봤다.

## InfiniBand는 케이블이 아니라 아키텍처다

2003년 백서가 IB를 꺼낸 이유는 PCI 같은 공유 버스의 한계였다. CPU와 메모리는 빨라지는데 I/O 버스가 못 따라왔고, PCI-X가 133 MHz까지 올라가도 약 1 GB/s에서 막혔다. 그런데 IB 4X 링크 하나가 양방향 합산 2.5 GB/s라 PCI-X 자체가 병목이 되는 상황이었다. 그래서 IB는 공유 버스를 switch 기반 point-to-point fabric으로 바꾼다. 버스는 장비가 늘수록 대역폭을 나눠 갖지만, switch fabric은 스위치를 더 달면 end-node와 총 대역폭이 같이 늘고 multipath로 이중화까지 된다.

IB가 단순한 물리 연결이 아니라 physical부터 transport, management, 소프트웨어 인터페이스까지 걸친 아키텍처라는 게 핵심이다. 몇 가지가 1주차/RoCE 얘기와 직접 이어진다.

- Transport service type이 네 가지다. RC(Reliable Connection, ACK 기반 연결형), UC(Unreliable Connection, ACK 없는 연결형), UD(Unreliable Datagram, ACK 없는 비연결형), RD(Reliable Datagram, ACK 기반 다중화). NCCL이나 MPI가 거의 RC만 쓰는데, RDMA Read와 Atomic이 RC에서만 되기 때문이다.
- 주소 체계가 LID, GID, GUID, PKEY로 나뉜다. LID는 16비트 지역 주소로 Subnet Manager가 동적 할당하고 서브넷 안에서만 의미가 있다(IPv4 비슷). GID는 128비트로 서브넷을 넘는 주소고 IPv6 형식이다. GUID는 64비트 영구 식별자(MAC 비슷), PKEY는 파티션을 가르는 16비트 키(VLAN 비슷)다.
- 무손실을 링크 계층에서 거저 얻는다. IB는 credit 기반 흐름 제어라 받는 쪽 버퍼가 있을 때만 보내서 거의 안 떨군다. 그리고 Virtual Lane으로 우선순위를 가르는데, VL15는 관리 트래픽 전용 최우선 레인이라 데이터가 아무리 몰려도 fabric 설정과 장애 처리가 굶지 않는다.

Subnet Manager가 LID를 뿌리고 경로를 잡는 것도 IB만의 그림이다. RoCEv2는 이걸 IP가 대신하니까 SM이 필요 없는 대신, 뒤에서 보듯 이더넷 스위치 설정이 훨씬 중요해진다.

## RDMA를 나르는 세 갈래

같은 RDMA 패킷을 실어 나르는 네트워크가 셋이다. IB, RoCE, iWARP인데 교재 기준 정리는 이렇다. IB와 RoCE는 둘 다 IBTA가 관리하고, RoCE는 다시 v1과 v2로 갈린다. RoCEv1은 IB의 network layer는 두고 link layer만 이더넷으로 바꾼 거라 같은 L2 안에 갇혔고, 지금은 거의 안 쓴다. RoCEv2는 IB의 network layer를 IP + UDP로 갈아끼우면서 IB의 Base Transport Header(BTH)와 payload는 그대로 둔다. iWARP는 TCP 위에 올린 경쟁 방식인데 역시 널리 쓰이진 않는다. 그래서 현 시점 구현은 사실상 다 RoCEv2다.

| 구분 | InfiniBand | RoCEv2 |
|---|---|---|
| 기본 성격 | 전용 HPC/RDMA 네트워크 | Ethernet 기반 RDMA |
| 물리/링크 | IB HCA, IB Switch | Ethernet NIC, Ethernet Switch |
| 라우팅 | Subnet Manager, LID/GID | IP 라우팅 가능 |
| 캡슐화 | LRH/GRH/BTH | Ethernet + IP + UDP + BTH |
| UDP 포트 | 안 씀 | 4791 |
| 무손실 | 패브릭 자체가 RDMA용 | PFC/ECN/DCQCN 튜닝 필요 |
| 운영 | 전용 장비 이해 필요 | 이더넷 지식 + RoCE 튜닝 |

RoCEv2 패킷을 좀 더 뜯으면, L3는 IP, L4는 UDP에 목적지 포트가 4791로 고정이고 그 다음이 IB BTH다. UDP source port는 QP에서 파생되는데, 이게 뒤에 나올 ECMP 분산에서 중요한 손잡이가 된다. RoCEv2는 UDP라 TCP 같은 자체 신뢰성이 없어서, BTH의 Packet Sequence Number로 순서와 재전송을 챙긴다.

## RoCEv1과 v2를 가르는 건 GID 인덱스다

코드에서 v1과 v2가 갈리는 지점이 GID 테이블이다. RoCEv2는 LID 개념이 없고 GID만 쓰는데, GID는 IPv4/IPv6 주소를 IPv6 형식으로 인코딩한 값이다. 같은 NIC의 GID 테이블을 보면 같은 IP가 v1용과 v2용으로 두 번 나온다.

```bash
ibv_devinfo -d mlx5_0 -v
# GID[0]:  fe80::...                      (link-local IPv6, RoCEv1)
# GID[1]:  fe80::...                      (link-local IPv6, RoCEv2)
# GID[2]:  ::ffff:10.0.0.1                (IPv4 mapped, RoCEv1)
# GID[3]:  ::ffff:10.0.0.1                (IPv4 mapped, RoCEv2)  ← 보통 이 인덱스
```

같은 `10.0.0.1`이 인덱스 2(v1)와 3(v2)에 다 있어서, RoCEv2를 쓰려면 v2 인덱스를 정확히 골라야 한다. 잘못 고르면 RoCEv1으로 동작해 라우팅이 깨지는데, 에러도 안 뜨고 조용히 안 붙는 게 함정이다. MOFED의 `show_gids`가 이 매핑을 한눈에 보여준다.

이게 verbs 코드에서는 `ah_attr`의 플래그 하나로 드러난다. IB는 LID로 라우팅하니 `is_global = 0`에 `dlid`를 채우고, RoCEv2는 IP로 라우팅하니 `is_global = 1`로 GRH를 강제하고 `dlid = 0`(RoCE에선 LID 무의미), GID에 상대 IP, `sgid_index = 3`을 넣는다.

```c
// RoCEv2일 때
.ah_attr = {
    .is_global  = 1,        // GRH 필수
    .dlid       = 0,        // RoCE는 LID 의미 없음
    .grh = {
        .dgid       = peer->gid,   // 상대 IP를 GID로
        .sgid_index = 3,           // RoCEv2 GID 인덱스
        .hop_limit  = 1,
    },
}
```

`is_global` 하나가 wire 포맷을 바꾼다. 1주차 글에서도 `is_global = 0`인데 GID를 쓰면 조용히 실패한다고 했는데, v1/v2 인덱스를 잘못 고르는 것도 같은 류의 말없는 실패다.

## BTH는 양쪽이 공유하는 transport의 심장

IB든 RoCEv2든 안 바뀌는 건 BTH 이하다. BTH(Base Transport Header)가 이 패킷이 어떤 동작인지(OpCode), 어느 큐로 가는지(Destination QP, 24비트), 몇 번째인지(PSN, 24비트)를 담는다. RDMA WRITE처럼 '원격 메모리 어디에 쓸지'가 더 필요한 동작은 BTH 뒤에 RETH 같은 확장 헤더가 붙어 원격 VA와 R_Key, 길이를 싣는다. ACK 패킷은 BTH 위에 AETH가 붙어 ACK인지 NACK인지와 MSN을 담아서, 발신자가 빠진 ACK를 알아챈다.

| BTH 필드 | 의미 |
|---|---|
| OpCode | 어떤 RDMA operation인지 |
| P_Key | partition 격리 식별자 |
| FECN/BECN | congestion notification |
| Destination QP | 목적지 Queue Pair 번호 |
| PSN | Packet Sequence Number (순서/재전송) |

RoCEv2가 BTH를 그대로 둔다는 건, RDMA의 윗부분(verbs API, QP, MR, RC/UC/UD)이 IB와 완전히 같다는 뜻이다. ziwon 레포가 짚듯 같은 코드가 양쪽에서 거의 그대로 돈다. 갈리는 건 BTH를 LRH/GRH로 싸느냐(IB) Ethernet/IP/UDP로 싸느냐(RoCEv2)뿐이다.

## RoCEv2의 어려운 부분은 코드가 아니라 스위치다

그래서 RoCEv2의 진짜 난이도는 verbs가 아니라 무손실 이더넷을 만드는 데 있다. IB는 credit 흐름 제어로 무손실을 거저 얻지만, RoCEv2가 올라타는 이더넷은 기본이 lossy라 혼잡 때 떨군다. RDMA는 RC 재전송이 go-back-N이라 하나만 떨어져도 그 뒤를 다 다시 보내서 손실에 약하다. 그걸 막으려고 PFC로 특정 priority를 무손실로 만들고, ECN과 DCQCN으로 끝단 rate를 조절한다. ziwon 레포가 "성능 차이의 90%는 네트워크 설정이 결정한다"고 못 박는 게 이 지점이다.

라우팅 쪽은 반대로 RoCEv2가 유리하다. UDP/IP 위라 L3 라우팅이 되고, 다른 IP 서브넷을 넘는 RDMA가 되고, UDP source port를 flow마다 바꿔 ECMP로 여러 경로에 흩뿌릴 수 있다. IB는 한 서브넷 안에서만 동작하고 서브넷을 넘으려면 IB router가 필요한데 잘 안 쓴다. 정리하면 IB는 무손실을 fabric으로 거저 얻는 대신 전용 장비에 묶이고, RoCEv2는 기존 이더넷과 IP 라우팅을 그대로 쓰는 대신 PFC와 ECN, DCQCN을 얹어 무손실을 어렵게 흉내 낸다. 그 혼잡 제어가 어떻게 도는지는 [따로 팠다](../rocev2-congestion/).
