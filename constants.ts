

export const MOCK_USERS = [
  { id: 1, name: "김철수", email: "chulsoo@example.com", role: "Admin", lastLogin: "2023-10-25" },
  { id: 2, name: "이영희", email: "younghee@test.co.kr", role: "User", lastLogin: "2023-10-24" },
  { id: 3, name: "Park Ji-sung", email: "js.park@soccer.net", role: "User", lastLogin: "2023-10-20" },
  { id: 4, name: "Steve Jobs", email: "steve@apple.com", role: "Admin", lastLogin: "2011-10-05" },
  { id: 5, name: "Hong Gil-dong", email: "hong@joseon.kr", role: "Guest", lastLogin: "2023-01-01" },
];

export const DEFAULT_KNOWLEDGE = `[Winpos3 Database Schema & Business Rules]

1. 판매/출고 (Sales/Outbound)
- **outm_YYMM** (월별 판매 마스터): junno(PK), day1(날짜), posno(포스번호), memberno(회원번호), tmamoney1(총매출), tmoneydc(할인), sale_status(판매구분) -> **핵심 매출 요약 테이블**
- **outd_YYMM** (월별 판매 상세): scancode(PK), junno(FK), barcode(상품코드), mitemcount(수량), money1(단가), money1vat1dc(실판매액) -> **개별 상품 판매 내역**

2. 구매/입고
- ipgom_YYMM, ipgod_YYMM

3. 재고/상품
- parts: barcode, descr(상품명), curjago(현재재고)
- 재고 확인은 무조건 'parts' 테이블의 'curjago' 컬럼입니다.

4. 핵심 로직 가이드 (CRITICAL RULES)
- **시간 기준**: 모든 날짜와 시간은 **대한민국 표준시(KST)** 기준입니다.
- **테이블 접미사**: 테이블 이름 뒤의 _YYMM은 현재 한국 시간 기준 연월입니다. (예: 한국이 5월이면 outm_2505)
- **오늘/실시간 매출 쿼리 규칙 (!!가장 중요!!)**:
  - **'오늘', '현재', '지금', '실시간'** 등 현시점을 의미하는 단어가 포함된 매출 관련 질문은 **무조건 'outm_YYMM' 테이블**을 사용해야 합니다.
  - 날짜 조건 형식은 반드시 **'YYYY-MM-DD'** 입니다. (예: WHERE day1 = '2025-05-20')
  - 'outd_YYMM'은 개별 품목 조회 시에만 사용하고, 총 매출 집계는 'outm_YYMM'을 사용하세요.
  - 절대 별도의 '마감(close)', 'history' 테이블을 찾지 마세요.
  - 연습모드('9')는 항상 제외해야 합니다. (WHERE sale_status != '9')

5. 자주 묻는 질문 예시 (Example SQL)
- Q: "오늘 매출 얼마야?"
  A: SELECT ISNULL(SUM(tmamoney1), 0) as TodaySales FROM outm_{CurrentYYMM} WHERE day1 = '{CurrentYYYY-MM-DD}' AND sale_status != '9'

- Q: "지금 제일 많이 팔린 상품?"
  A: SELECT TOP 5 p.descr, SUM(d.mitemcount) as Qty FROM outd_{CurrentYYMM} d JOIN parts p ON d.barcode = p.barcode WHERE d.day1 = '{CurrentYYYY-MM-DD}' AND d.sale_status != '9' GROUP BY p.descr ORDER BY Qty DESC
`;
