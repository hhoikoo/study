# 2주차: GPU 클러스터 네트워크, 인터커넥트부터 ROD/RUD까지

1주차가 'GPU는 빠른데 왜 네트워크가 병목이냐'를 넓게 깔았다면, 2주차는 그 네트워크를 실제로 어떻게 짜는지로 들어갔다. 스터디가 던진 질문 네 개가 그대로 회차의 뼈대였다. GPU 통신에서 PCIe나 CPU 소켓 경유를 왜 피하나, RDMA를 나르는 IB와 RoCEv2는 어떻게 다른가, RoCEv2의 혼잡은 어떻게 제어하나, 그리고 GPU 클러스터 네트워크를 어떤 원칙으로 설계하나(ROD/RUD 포함). 앞 두 질문이 랙 안 scale-up이고 뒤 두 질문이 랙을 넘는 scale-out이라, 한 패키지 안 다이부터 랙과 랙 사이까지 한 번에 훑은 셈이다.

## GPU를 잇는 길: PCIe를 왜 피하나

첫 질문은 GPU끼리 통신할 때 왜 PCIe나 CPU를 거치지 않으려 하느냐였다. 답은 NVIDIA가 쌓아 올린 인터커넥트 사다리에 있다. NV-HBI가 한 패키지 안 다이 두 개를 약 10 TB/s로 붙이고, NVLink-C2C가 CPU와 GPU를 900 GB/s로 메모리까지 공유하게 잇고, NVLink가 GPU끼리 직결하고, NVSwitch가 그걸 묶는다. PCIe Gen5 x16이 약 128 GB/s인데 NVLink 5세대가 1.8 TB/s라 14배 가까이 벌어지니, GPU 전용 길을 따로 깐 이유가 숫자로 그대로 드러난다. 그렇다고 PCIe가 사라진 건 아니고, CPU와 GPU를 잇고 NIC를 붙이는 표준 도로로 여전히 쓰인다. 이 사다리를 [다이에서 랙까지](interconnect-ladder/) 자세히 봤고, 그 인터커넥트가 [A100에서 B300까지](gpu-generations/) GPU 세대와 어떻게 같이 움직였는지도 따로 정리했다. 하드웨어 길이 깔려 있어도 NCCL이 어떤 collective를 어느 경로로 푸느냐, GPU와 NIC가 같은 NUMA 노드에 묶여 GPUDirect가 살아 있느냐가 또 다른 변수라, [노드 안 통신](nccl-and-numa/)도 같이 봤다.

## IB vs RoCEv2: 같은 RDMA, 다른 wire

두 번째는 RDMA를 IB와 RoCEv2가 각각 어떻게 나르느냐였다. 둘은 RDMA의 윗부분(verbs, QP, MR, RC/UC/UD)이 완전히 같고, IB의 Base Transport Header 이하 transport도 공유한다. 갈리는 건 그 transport를 무엇으로 싸느냐다. IB는 LRH/GRH로 전용 fabric 안에서 라우팅하면서 credit 흐름 제어로 무손실을 거저 얻고, RoCEv2는 그 자리를 Ethernet/IP/UDP(포트 4791)로 갈아끼워 기존 이더넷과 IP 라우팅을 그대로 쓴다. 대신 RoCEv2는 lossy 이더넷 위라 무손실을 따로 만들어야 한다. RoCEv1과 v2를 가르는 GID 인덱스, 잘못 고르면 조용히 깨지는 함정, BTH 필드까지 [IB vs RoCEv2 글](ib-vs-rocev2/)에서 파고들었다.

## RoCEv2 혼잡 제어: PFC, ECN, DCQCN, 그 다음

세 번째가 RoCEv2 혼잡 제어다. 1주차에서 PFC/ECN/DCQCN을 논문으로 한 번 봤는데, 2주차는 교재 쪽에서 스위치 설정과 함께 다시 보면서 그 너머까지 갔다. 핵심 설계는 ECN threshold를 PFC XOFF threshold보다 낮게 둬서, 부드럽고 flow 단위인 ECN이 먼저 rate를 줄이고 강하고 클래스 전체를 멈추는 PFC를 마지막 방어선으로만 쓰는 거다. 여기에 혼잡이 대역폭 부족만으로 생기는 게 아니라는 framing(incast, ECMP 충돌), elephant flow와 flowlet, 그리고 ECN의 느림과 PFC의 둔함을 보완하려는 SFC와 CSIG까지 [혼잡 제어 글](rocev2-congestion/)에 담았다.

## GPU 클러스터 설계: ROD와 RUD

마지막이 이 GPU들을 어떤 네트워크에 꽂느냐였다. 설계의 출발점이 셋이다. 계층을 줄이는 high-radix 스위치, 다운링크와 업링크를 1:1로 맞춰 non-blocking으로 만드는 오버서브스크립션 비율, 그리고 같은 번호 GPU를 같은 leaf에 모으는 rail이다. 이 rail을 GPU별로 나눠 꽂아 같은 번호끼리 one-hop으로 묶는 게 ROD(Rail-Optimized Design)고, 여러 GPU를 한 leaf로 묶어 케이블을 단순화하는 대신 그 leaf가 죽으면 서버가 고립되는 게 RUD(Rail-Unified Design)다. 거기에 leaf를 랙 어디에 두느냐(ToR/MoR/EoR)까지가 [클러스터 설계 글](cluster-design-rod-rud/)의 내용이다.

네 질문을 잇는 줄은 결국 하나다. scale-up은 '제일 빠른 한 링크'가 닿는 GPU 수를 늘려 동기화 비용이 큰 통신을 그 안에 가두고, scale-out은 RoCEv2와 혼잡 제어, ROD/RUD로 랙과 랙을 손실 없이 꿰맨다. 둘 다 같은 목적을 향하는데, 비싼 GPU가 네트워크를 기다리느라 노는 시간을 없애는 것이다.
