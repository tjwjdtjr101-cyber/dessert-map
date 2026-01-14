import os, re, json, time
import requests
from collections import defaultdict

CLIENT_ID = os.environ["NAVER_CLIENT_ID"]
CLIENT_SECRET = os.environ["NAVER_CLIENT_SECRET"]

HEADERS = {
    "X-Naver-Client-Id": CLIENT_ID,
    "X-Naver-Client-Secret": CLIENT_SECRET,
}

# ✅ 구 단위로 검색 풀 확장 (처음엔 핵심 구만. 필요하면 25개로 늘리면 됨)
DISTRICTS = [
    "강남구", "서초구", "송파구", "성동구", "마포구",
    "용산구", "영등포구", "강동구", "광진구", "동대문구",
]

# ✅ 카테고리별 키워드 묶음 (너 서비스 상단 탭에 대응)
CATEGORIES = {
    "dubai": [
        "두바이쫀득쿠키",
        "두바이 쿠키",
        "두바이 초콜릿 쿠키",
        "피스타치오 카다이프 쿠키",
        "카다이프 쿠키",
    ],
    "cake": [
        "조각케이크",
        "홀케이크",
        "생크림케이크",
        "케이크 맛집",
    ],
    "bungeoppang": [
        "붕어빵",
        "팥붕어빵",
        "슈붕",
        "크림붕어빵",
    ],
    "goguma": [
        "군고구마",
        "고구마 간식",
        "군고구마 맛집",
    ],
}

# ✅ 카테고리별 최대 수집량 (쿼터/노이즈 방지용)
PER_CATEGORY_LIMIT = {
    "dubai": 60,
    "cake": 120,
    "bungeoppang": 120,
    "goguma": 80,
}

# ✅ 한 번 실행에서 전체 최대 몇 개까지 저장할지
TOTAL_TARGET = 300

# ✅ 페이지 훑는 범위 (start는 1~1000 가능하지만 쿼터 고려해서 적당히)
START_RANGE = range(1, 101, 5)  # 1,6,11,...,96
DISPLAY = 5

def clean_html(s: str) -> str:
    return re.sub(r"<.*?>", "", s or "").strip()

def normalize_key(name: str, address: str) -> str:
    # 공백/특수문자 줄이고 비교 안정화
    n = re.sub(r"\s+", " ", (name or "").strip()).lower()
    a = re.sub(r"\s+", " ", (address or "").strip()).lower()
    return f"{n}|{a}"

def district_from(addr: str) -> str:
    parts = (addr or "").split()
    if len(parts) >= 2 and parts[0].startswith("서울"):
        return parts[1]  # e.g., 강남구
    return ""

def search_local(query: str, start: int, display: int = DISPLAY):
    url = "https://openapi.naver.com/v1/search/local.json"
    # ✅ random은 커버리지/재현성 떨어져서 비추. sim/comment가 더 안정적.
    params = {"query": query, "display": display, "start": start, "sort": "sim"}
    r = requests.get(url, headers=HEADERS, params=params, timeout=15)
    r.raise_for_status()
    return r.json().get("items", [])

def try_parse_latlng(mapx, mapy):
    # 네이버 local 검색 mapx/mapy는 보통 * 1e7 형태
    try:
        lng = float(mapx) / 1e7
        lat = float(mapy) / 1e7
        # 서울 대략 범위
        if 37.3 <= lat <= 37.8 and 126.7 <= lng <= 127.3:
            return round(lat, 6), round(lng, 6)
    except:
        pass
    return None

def is_seoul_address(address: str) -> bool:
    return (address or "").startswith("서울") or "서울" in (address or "")

stores = []
by_key = {}  # key -> store dict
category_counts = defaultdict(int)

next_id = 1

def can_take_category(cat: str) -> bool:
    return category_counts[cat] < PER_CATEGORY_LIMIT.get(cat, 0)

def total_count() -> int:
    return len(by_key)

# ✅ 수집 시작
for gu in DISTRICTS:
    for category, keywords in CATEGORIES.items():
        if not can_take_category(category):
            continue

        for kw in keywords:
            if not can_take_category(category) or total_count() >= TOTAL_TARGET:
                break

            # ✅ 쿼리: "서울 {구} {키워드}"
            query = f"서울 {gu} {kw}"

            for start in START_RANGE:
                if not can_take_category(category) or total_count() >= TOTAL_TARGET:
                    break

                try:
                    items = search_local(query, start=start, display=DISPLAY)

                    print(f"[{query}] start={start} items={len(items)}")
                except Exception:
                    time.sleep(0.5)
                    continue

                for it in items:
                    name = clean_html(it.get("title", ""))
                    address = (it.get("roadAddress") or it.get("address") or "").strip()

                    # ✅ 서울 주소만 (너 서비스가 서울 디저트맵이니까)
                    if not is_seoul_address(address):
                        continue

                    pos = try_parse_latlng(it.get("mapx"), it.get("mapy"))
                    if not pos:
                        continue

                    key = normalize_key(name, address)
                    lat, lng = pos

                    # ✅ 이미 있는 매장이면 categories에 추가
                    if key in by_key:
                        s = by_key[key]
                        if category not in s["categories"] and can_take_category(category):
                            s["categories"].append(category)
                            category_counts[category] += 1
                            print(f"➕ category added: {category} -> {name}")
                        continue

                    # ✅ 새 매장 추가
                    print(f"ADD {name} | {address}")
                    if not can_take_category(category):
                        continue

                    store = {
                        "id": next_id,
                        "name": name,
                        "address": address,
                        "district": district_from(address),
                        "lat": lat,
                        "lng": lng,
                        # ✅ 핵심: 여러 카테고리 저장
                        "categories": [category],

                        # 아래는 기존 프론트 호환용 필드(유지)
                        "status": "available",
                        "price": 5500,
                        "rating": 4.6,
                        "distance": "",
                        "instagramHandle": "",
                    }

                    by_key[key] = store
                    next_id += 1
                    category_counts[category] += 1

                    print(f"Collected {total_count()}/{TOTAL_TARGET} (cat:{category}={category_counts[category]})")

                time.sleep(0.2)

# ✅ JSON 저장
os.makedirs("public", exist_ok=True)
out_path = "public/stores.json"

# id 순 정렬(안정성)
stores = sorted(by_key.values(), key=lambda x: x["id"])

with open(out_path, "w", encoding="utf-8") as f:
    json.dump(stores, f, ensure_ascii=False, indent=2)

print(f"✅ wrote {len(stores)} stores to {out_path}")
print("✅ category_counts:", dict(category_counts))