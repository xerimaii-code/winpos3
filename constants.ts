
export const MOCK_USERS = [
  { id: 1, name: "김철수", email: "chulsoo@example.com", role: "Admin", lastLogin: "2023-10-25" },
  { id: 2, name: "이영희", email: "younghee@test.co.kr", role: "User", lastLogin: "2023-10-24" },
  { id: 3, name: "Park Ji-sung", email: "js.park@soccer.net", role: "User", lastLogin: "2023-10-20" },
  { id: 4, name: "Steve Jobs", email: "steve@apple.com", role: "Admin", lastLogin: "2011-10-05" },
  { id: 5, name: "Hong Gil-dong", email: "hong@joseon.kr", role: "Guest", lastLogin: "2023-01-01" },
];

export const DEFAULT_KNOWLEDGE = `[Winpos3 Database Schema & Business Rules]

1. 판매/출고 (Sales/Outbound)
- outm_YYMM (월별 판매 마스터): junno(PK,전표번호), day1(날짜), posno(포스번호), memberno(회원번호), tmamoney1(총매출), tmoneydc(할인), sale_status(판매구분)
- outd_YYMM (월별 판매 상세): scancode(PK), junno(FK), barcode(상품코드), mitemcount(수량), money1(단가), money1vat1dc(실판매액)
- 특징: outd_YYMM 및 outm_YYMM 테이블은 마감 여부와 관계없이 현재 날짜(Today)의 실시간 매출 데이터를 포함하고 있습니다.
- cancel_parts: 취소된 상품 거래 상세
- 주의: sale_status '0'=정상, '1'=반품, '9'=연습(집계제외)

2. 구매/입고 (Purchase/Inbound)
- ipgom_YYMM (월별 입고 마스터): junno(PK), day1, comcode(거래처), ipgo(입고액), banpum(반품액)
- ipgod_YYMM (월별 입고 상세): scancode(PK), junno(FK), barcode, iitemcount(입고수량), money0vat(단가)
- baljum_YYMM/baljud_YYMM: 발주 마스터/상세

3. 재고/상품 (Inventory/Parts)
- parts (상품 마스터): barcode(PK), descr(상품명), money1(판매가), money0vat(매입가), curjago(현재재고), comcode(주거래처)
- jagod_YYMM: 재고 실사/조정 내역
- beforec_YYMM: 월별 이월 재고

4. 거래처 (Vendor)
- comp (거래처 마스터): comcode(PK), comname(상호), comno(사업자번호)
- compio: 거래처별 입출금 요약

5. 회원/포인트 (Member)
- member: memberno(PK), name1(이름), tel(전화), score(포인트), remain_money(잔액)
- cashback, cashback_hist: 캐시백 적립/사용 이력
- mem_x: 포인트/잔액 변동 상세

6. 결제 상세
- credit_cd: 신용카드 승인 내역 (xjunno=판매전표번호)
- cash_cd: 현금영수증 승인 내역
- all_cms/all_hmc: 쿠폰 및 제휴 할인 내역

7. 핵심 로직 가이드
- 모든 _YYMM 테이블은 월별 파티션입니다 (예: outm_2310). 쿼리 시 적절한 월 테이블을 선택하세요.
- 질문에 **'오늘', '현재', '지금', '실시간', '현시점'** 등의 단어가 포함되면, 반드시 **outd_YYMM** (상세) 또는 **outm_YYMM** (마스터) 테이블을 조회해야 합니다. 절대 별도의 마감 테이블을 찾지 마세요.
- 매출 조회 시 'sale_status=9' (연습모드)는 반드시 제외해야 합니다. (WHERE sale_status != '9')
- 재고(curjago)는 실시간으로 변동되므로 parts 테이블을 조회합니다.

8. 자주 묻는 질문 예시 쿼리 (Example Queries)
- Q: "오늘 매출 얼마야?" (Today's Sales)
  A: SELECT ISNULL(SUM(tmamoney1), 0) as TotalSales 
     FROM outm_{CurrentYYMM} 
     WHERE day1 = '{CurrentYYYYMMDD}' AND sale_status != '9'
`;