
export const MOCK_USERS = [
  { id: 1, name: "김철수", email: "chulsoo@example.com", role: "Admin", lastLogin: "2023-10-25" },
  { id: 2, name: "이영희", email: "younghee@test.co.kr", role: "User", lastLogin: "2023-10-24" },
  { id: 3, name: "Park Ji-sung", email: "js.park@soccer.net", role: "User", lastLogin: "2023-10-20" },
  { id: 4, name: "Steve Jobs", email: "steve@apple.com", role: "Admin", lastLogin: "2011-10-05" },
  { id: 5, name: "Hong Gil-dong", email: "hong@joseon.kr", role: "Guest", lastLogin: "2023-01-01" },
];

export const DEFAULT_KNOWLEDGE = `[Winpos3 Database Schema & Business Rules]

1. 판매/출고 (Sales/Outbound) - **실시간/현재 매출 핵심**
- **outd_YYMM** (월별 판매 상세): scancode(PK), junno(FK), barcode(상품코드), mitemcount(수량), money1(단가), money1vat1dc(실판매액)
- **outm_YYMM** (월별 판매 마스터): junno(PK), day1(날짜), posno(포스번호), memberno(회원번호), tmamoney1(총매출), tmoneydc(할인), sale_status(판매구분)
- **규칙 1**: **'오늘', '현재', '지금', '실시간'** 매출을 물으면 **무조건** 'outd_YYMM' 테이블을 사용하세요. (마감 테이블 아님!)
- **규칙 2**: 마감되었는지 여부는 중요하지 않습니다. 현재 월의 데이터는 모두 여기 있습니다.

2. 구매/입고
- ipgom_YYMM, ipgod_YYMM

3. 재고/상품
- parts: barcode, descr(상품명), curjago(현재재고)
- 재고 확인은 무조건 'parts' 테이블의 'curjago' 컬럼입니다.

4. 핵심 로직 가이드 (CRITICAL RULES)
- **시간 기준**: 모든 날짜와 시간은 **대한민국 표준시(KST)** 기준입니다.
- **테이블 접미사**: 테이블 이름 뒤의 _YYMM은 현재 한국 시간 기준 연월입니다. (예: 한국이 5월이면 outd_2505)
- **오늘 매출 쿼리 작성법**:
  - 절대 별도의 '마감(close)', 'history' 테이블을 찾지 마세요.
  - **outd_YYMM** 테이블을 조회하세요.
  - 조건: WHERE day1 = '{TodayYYYYMMDD}' AND sale_status != '9'
  - 연습모드('9')는 항상 제외해야 합니다.

5. 자주 묻는 질문 예시 (Example SQL)
- Q: "오늘 매출 얼마야?"
  A: SELECT ISNULL(SUM(money1vat1dc), 0) as TodaySales FROM outd_{CurrentYYMM} WHERE day1 = '{CurrentYYYYMMDD}' AND sale_status != '9'

- Q: "지금 제일 많이 팔린 상품?"
  A: SELECT TOP 5 barcode, SUM(mitemcount) as Qty FROM outd_{CurrentYYMM} WHERE day1 = '{CurrentYYYYMMDD}' AND sale_status != '9' GROUP BY barcode ORDER BY Qty DESC
`;