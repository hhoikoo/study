# 노드 안 통신: NCCL collective 8종부터 NUMA 배치까지

2주차 기본 지식에서 GPU 클러스터 설계로 넘어가기 전에, 노드 안에서 데이터가 실제로 어떻게 움직이는지를 짚었다. fabric을 아무리 잘 짜도 GPU 한 장이 NIC까지 가는 길, 두 GPU가 만나는 경로가 어긋나 있으면 거기서 새기 때문이다. NCCL이 어떤 collective를 제공하고 그걸 어떤 물리 경로로 푸는지, 그리고 그 경로를 결정하는 NUMA 배치까지 한 줄로 이어진다. NCCL과 ring/tree 알고리즘 자체는 [1주차에서 따로 팠고](../../week1-ai-model-lifecycle/nccl-collectives/), 여기서는 collective 8종 표와 노드 안 경로, NUMA를 보충한다. NCCL은 CUDA Toolkit이 주는 GPU 가속 라이브러리 위에서 돌고, 노드 안에선 PCIe와 NVLink, 노드 간에선 NVIDIA 네트워킹으로 통신을 편다.

## collective는 4개 패턴의 조합이다

NCCL이 제공하는 집합 통신은 기본 4개 패턴의 조합으로 본다. 방향과 데이터 형태로 가르면 이렇다.

| 패턴 | 방향 | 데이터 | 대표 용도 |
|---|---|---|---|
| Broadcast | root → all | 같은 값 복제 | 초기 weight/buffer 동기화 |
| Scatter | root → all | 서로 다른 chunk | 배치/파티션 분배 |
| Gather | all → root | concat | 결과 수집 |
| Reduce | all → root | element-wise op (sum/max) | loss/gradient 집계 |

이 넷을 조합하면 자주 쓰는 collective가 다 나온다. AllGather는 Gather + Broadcast, AllReduce는 Reduce + Broadcast다. 1주차에서 본 것처럼 AllReduce는 ReduceScatter + AllGather로 짜도 같은 결과가 나오고, 그 조합이 링 위에서 통신량이 더 적다. AlltoAll은 각 rank가 각 rank에게 다른 chunk를 보내는 Scatter의 전치 버전이고, MoE의 token dispatch가 이걸 쓴다.

실제 NCCL API로 내려오면 collective가 8종이다. 학습에서 어디에 쓰는지까지 붙이면 표가 또렷해진다.

| 이름 | 의미 | ML 용도 |
|---|---|---|
| `ncclAllReduce` | all ranks 값을 reduce, 결과를 all ranks가 | DDP gradient sync |
| `ncclBroadcast` | root 값을 all ranks에 복제 | init param sync |
| `ncclReduce` | all ranks 값을 reduce, root만 결과 | norm 집계 |
| `ncclAllGather` | 각자의 chunk를 all ranks가 concat | ZeRO-3 / FSDP param |
| `ncclReduceScatter` | reduce 후 rank별 chunk로 분배 | FSDP gradient |
| `ncclGather` | all ranks chunk를 root에 concat | 결과 취합 |
| `ncclScatter` | root chunk를 rank별로 배포 | 배치 분배 |
| `ncclAlltoAll` | 각 rank가 각 rank에게 chunk 교환 | MoE token dispatch |

DDP의 gradient 동기화가 `ncclAllReduce`, FSDP/ZeRO-3의 parameter와 gradient가 `ncclAllGather`와 `ncclReduceScatter`, MoE의 expert dispatch가 `ncclAlltoAll`로 떨어진다. 1주차에서 본 병렬화 전략들이 결국 이 8종 중 하나로 내려간다.

## 같은 노드 안에서도 경로가 4단계로 갈린다

collective가 '무엇을 주고받을지'라면, 그걸 어느 선으로 나르는지는 GPU 사이 거리가 정한다. 같은 노드 안이라도 우선순위가 있다.

| 순위 | 경로 | 조건 |
|---|---|---|
| 1 | P2P over NVLink | NVLink 직결 |
| 2 | P2P over PCIe | NVLink 없을 때 |
| 3 | SHM (host memory 경유) | P2P 불가능하거나 inter-socket P2P가 비효율적일 때 |
| 4 | NIC loopback | GPU마다 local NIC + GPUDirect RDMA 가능 |

같은 process 안의 rank끼리는 P2P_DIRECT가 켜져 staging FIFO를 건너뛴다. 3순위 SHM은 두 GPU가 직접 P2P를 못 할 때(서로 다른 PCIe root complex나 NUMA socket에 걸쳐 있을 때) host RAM을 공유 버퍼로 두고 만나는 fallback이다. 이 사다리를 사용자가 손으로 막거나 열 수 있는 게 `NCCL_P2P_LEVEL`인데, P2P를 어느 거리까지 허용할지를 `LOC`(절대 안 씀), `NVL`(NVLink 연결 시), `PIX`(같은 PCI 스위치), `PXB`(PCI 스위치 여러 홉), `PHB`(같은 NUMA 노드, CPU 경유), `SYS`(NUMA 노드 간, UPI/QPI 경유)로 매긴다. 값을 안 주면 NCCL이 아키텍처를 보고 자동으로 고른다.

이 경로가 실제로 어떻게 등급 매겨졌는지는 `nvidia-smi topo -m`으로 본다. 가까울수록 좋은데, `NV#`(NVLink 묶음 경유)가 최상이고 `PIX`(같은 PCI 스위치)면 양호, `PHB`나 `NODE`, `SYS`로 내려가면 CPU나 소켓 간 링크를 타서 재배치 대상이다.

전송 프로토콜은 `NCCL_PROTO`로 세 단계다. 1주차에선 LL/LL128/Simple의 효율 수치를 NVIDIA 1차 문서에서 못 찾아 통념으로만 적었는데, 스터디 자료의 정리가 그 빈자리를 채운다.

| Protocol | cache line | data 효율 | 적합 |
|---|---|---|---|
| `LL` | 8B (4B data + 4B flag) | 50% | 짧은 메시지, latency |
| `LL128` | 128B (120B data + 8B flag) | 93.75% | NVLink intra-node 중간 메시지 |
| `Simple` | full data + 별도 fence | 약 100% | 큰 메시지, throughput |

LL과 LL128의 핵심은 data 옆에 flag를 같이 실어서, 받는 쪽이 단일 word load로 ready를 폴링하고 PCIe doorbell을 따로 안 받는 거다. 그 대가가 효율 손실인데, LL128은 NVLink cache line 단위(128B)를 그대로 써서 손실을 8B까지 줄인다. NCCL이 무슨 알고리즘과 경로를 골랐는지는 `NCCL_DEBUG` 환경 변수로 로깅을 켜고 Nsight Systems(시스템 전체 타임라인)와 Nsight Compute(커널 내부)로 들여다본다.

## NUMA: 같은 소켓에 묶어야 P2P가 산다

경로의 마지막 변수가 NUMA다. NUMA(Non-Uniform Memory Access)는 CPU마다 로컬 메모리를 두고 다른 CPU의 메모리는 원격으로 분류하되 접근은 되게 한 구조다. 소켓이 2개 이상인 서버에서 각 소켓 CPU가 하나의 NUMA node가 되고, 로컬 메모리는 가깝지만 원격 메모리는 별도 링크를 타서 latency와 대역폭이 떨어진다. 그 소켓 간 링크가 Intel은 UPI, AMD는 Infinity Fabric(xGMI)다.

여기가 GPU 배치와 직접 얽힌다. 듀얼 소켓 서버에서 GPU와 그 NIC가 다른 소켓에 붙으면 트래픽이 소켓 간 링크를 건너야 하는데, 이 링크는 NVLink는 물론 로컬 PCIe Gen5 x16보다도 느리고 지연이 크다. Intel UPI는 Sapphire Rapids 기준 16 GT/s에 소켓당 최대 4링크, AMD xGMI는 4세대 EPYC 기준 최대 4링크 × 32 Gbps인데, 환산 GB/s는 두 벤더 다 공개를 안 해서 여기선 적지 않는다. 더 중요한 건 GPUDirect P2P/RDMA가 두 장치가 같은 PCIe root complex를 공유해야 동작한다는 점이다. UPI/QPI를 건너는 경로(`SYS`)는 성능이 극히 제한되거나 아예 안 돌고, 그러면 트래픽이 host memory를 경유하게 된다.

그래서 NUMA-aware 배치의 목표는 CPU, 메모리, I/O(NIC, NVMe, GPU)를 같은 NUMA node 안에 최대한 묶는 거다. 실무 배치 가이드가 분명하다.

- GPU와 그 NIC를 같은 PCIe 스위치 하위(`PIX`)에 둬서, GPUDirect RDMA가 CPU root complex도 소켓 간 링크도 안 건너게 한다. H100/H200 PCIe의 표준 NIC가 ConnectX-7(NDR 400G, PCIe Gen5 x16)이다.
- 듀얼 소켓이면 GPU와 NIC를 소켓별로 반씩 나눠 각 소켓 안에서 GPU-NIC 경로를 닫는다.
- PCIe ACS는 끈다. 켜져 있으면 같은 스위치 P2P도 root complex로 끌려 올라가 스위치 P2P 이점이 사라진다.
- TP가 필요한 GPU 쌍은 NVLink 브리지로 묶는다. H200 NVL이 2-way 900 GB/s, 4-way 최대 1.8 TB/s를 준다. 쌍을 넘는 TP는 PCIe로 떨어지니 피한다.

배치 결과는 다시 `nvidia-smi topo -m`으로 검증한다. GPU-NIC가 `PIX`나 `PXB`면 양호, `PHB`나 `NODE`, `SYS`면 재배치 대상이다. OS 쪽은 Linux의 first-touch policy가 변수인데, 메모리를 `malloc`한 시점이 아니라 그 페이지에 처음 접근한 CPU의 NUMA node에 물리 페이지가 할당되는 식이라, thread를 어느 소켓에서 처음 돌리느냐가 메모리 위치를 정한다. Kubernetes에서도 Topology Manager의 `single-numa-node` 정책으로 Pod의 CPU, GPU, RDMA NIC를 같은 NUMA node에 모은다. 한 가지 결이 다른 흐름이 NVIDIA의 CDMM인데, GPU 메모리를 OS에 software NUMA node로 노출하지 않고 NVIDIA 드라이버가 직접 관리하게 해서, GPU 메모리를 CPU 시스템 메모리와 분리하는 모드다. NUMA를 OS에 맡기는 대신 드라이버가 GPU 메모리 제어를 가져가는 쪽이다.
