import os, re, json, time
import requests
from collections import defaultdict

CLIENT_ID = os.environ["NAVER_CLIENT_ID"]
CLIENT_SECRET = os.environ["NAVER_CLIENT_SECRET"]

HEADERS = {
    "X-Naver-Client-Id": CLIENT_ID,
    "X-Naver-Client-Secret": CLIENT_SECRET,
}

DISTRICTS = [
    "강남구", "서초구", "송파구", "성동구", "마포구",
    "용산구", "영등포구", "강동구", "광진구", "동대문구",
]

CATEGORIES = {
    "dubai": ["두바이쫀득쿠키", "두바이 쿠키", "두바이 초콜릿 쿠키", "피스타치오 카다이프 쿠키", "카다이프 쿠키"],
    "cake": ["조각케이크", "홀케이크", "생크림케이크", "케이크 맛집"],
    "bungeoppang": ["붕어빵", "팥붕어빵", "슈붕", "크림붕어빵"],
    "goguma": ["군고구마", "고구마 간식", "군고구마 맛집"],
}

PER_CATEGORY_LIMIT = {
    "dubai": 60,
    "cake": 120,
    "bungeoppang": 120,
    "goguma": 80,
}

# ✅ "오늘" 신규로 추가할 목표 수
NEW_DAILY_TARGET = 50

PER_CATEGORY_LIMIT = {
  "dubai": 1000,
  "cake": 1000,
  "bungeoppang": 1000,
  "goguma": 1000,
}

# ✅ 파일이 너무 커지지 않게 전체 상한(선택)
TOTAL_HARD_CAP = 5000

# 검색 페이지 범위 (조금 넓혀 중복 감소)
START_RANGE = range(1, 301, 5)
DISPLAY = 5


def clean_html(s: str) -> str:
    return re.sub(r"<.*?>", "", s or "").strip()

def normalize_key(name: str, address: str, lat=None, lng=None) -> str:
    # 이름/주소 기반 키 + (가능하면 좌표까지 포함하면 더 안정적)
    n = re.sub(r"\s+", " ", (name or "").strip()).lower()
    a = re.sub(r"\s+", " ", (address or "").strip()).lower()
    if lat is not None and lng is not None:
        return f"{n}|{a}|{round(lat, 5)}|{round(lng, 5)}"
    return f"{n}|{a}"

def district_from(addr: str) -> str:
    parts = (addr or "").split()
    if len(parts) >= 2 and parts[0].startswith("서울"):
        return parts[1]
    return ""

def search_local(query: str, start: int, display: int = DISPLAY):
    url = "https://openapi.naver.com/v1/search/local.json"
    params = {"query": query, "display": display, "start": start, "sort": "sim"}
    r = requests.get(url, headers=HEADERS, params=params, timeout=15)
    r.raise_for_status()
    return r.json().get("items", [])

def try_parse_latlng(mapx, mapy):
    try:
        lng = float(mapx) / 1e7
        lat = float(mapy) / 1e7
        if 37.3 <= lat <= 37.8 and 126.7 <= lng <= 127.3:
            return round(lat, 6), round(lng, 6)
    except:
        pass
    return None

def is_seoul_address(address: str) -> bool:
    return (address or "").startswith("서울") or "서울" in (address or "")

def ensure_list_categories(store: dict):
    # 과거 데이터가 categories 없고 category 하나만 있을 수도 있으니 방어
    if "categories" not in store or not isinstance(store["categories"], list):
        c = store.get("category")
        store["categories"] = [c] if c else []
    # 중복 제거
    store["categories"] = list(dict.fromkeys(store["categories"]))


# -----------------------------
# ✅ 1) 기존 stores.json 로드해서 누적 기반 만들기
# -----------------------------
os.makedirs("public", exist_ok=True)
out_path = "public/stores.json"

by_key = {}
category_counts = defaultdict(int)
next_id = 1

existing = []
if os.path.exists(out_path):
    try:
        with open(out_path, "r", encoding="utf-8") as f:
            existing = json.load(f) or []
    except Exception:
        existing = []

max_id = 0
for s in existing:
    ensure_list_categories(s)

    max_id = max(max_id, int(s.get("id", 0)) if str(s.get("id", "0")).isdigit() else 0)

    # 기존 데이터 키 생성(좌표 있으면 포함)
    key = normalize_key(s.get("name", ""), s.get("address", ""), s.get("lat"), s.get("lng"))
    by_key[key] = s

    for cat in s.get("categories", []):
        if cat:
            category_counts[cat] += 1

next_id = max_id + 1

print(f"Loaded existing stores: {len(existing)} / next_id={next_id}")
print("Existing category_counts:", dict(category_counts))

# ✅ 오늘 신규로 추가한 개수
new_added = 0

def can_take_category(cat: str) -> bool:
    return category_counts[cat] < PER_CATEGORY_LIMIT.get(cat, 0)

def total_count() -> int:
    return len(by_key)


# -----------------------------
# ✅ 2) 수집 시작: "없는 매장만" 추가하고 오늘 목표 50개 채우면 종료
# -----------------------------
for gu in DISTRICTS:
    if new_added >= NEW_DAILY_TARGET:
        break

    for category, keywords in CATEGORIES.items():
        if new_added >= NEW_DAILY_TARGET:
            break

        if not can_take_category(category):
            continue

        for kw in keywords:
            if new_added >= NEW_DAILY_TARGET:
                break

            query = f"서울 {gu} {kw}"

            for start in START_RANGE:
                if new_added >= NEW_DAILY_TARGET:
                    break

                if total_count() >= TOTAL_HARD_CAP:
                    print("Reached TOTAL_HARD_CAP. stop.")
                    new_added = NEW_DAILY_TARGET
                    break

                try:
                    items = search_local(query, start=start, display=DISPLAY)
                    print(f"[{query}] start={start} items={len(items)}")
                except Exception:
                    time.sleep(0.5)
                    continue

                for it in items:
                    if new_added >= NEW_DAILY_TARGET:
                        break

                    name = clean_html(it.get("title", ""))
                    address = (it.get("roadAddress") or it.get("address") or "").strip()

                    if not is_seoul_address(address):
                        continue

                    pos = try_parse_latlng(it.get("mapx"), it.get("mapy"))
                    if not pos:
                        continue
                    lat, lng = pos

                    key = normalize_key(name, address, lat, lng)

                    # ✅ 이미 있는 매장이면 categories만 업데이트(신규 추가로 치지 않음)
                    if key in by_key:
                        s = by_key[key]
                        ensure_list_categories(s)
                        if category not in s["categories"] and can_take_category(category):
                            s["categories"].append(category)
                            category_counts[category] += 1
                            print(f"➕ category added: {category} -> {name}")
                        continue

                    # ✅ 신규 매장 추가
                    if not can_take_category(category):
                        continue

                    store = {
                        "id": next_id,
                        "name": name,
                        "address": address,
                        "district": district_from(address),
                        "lat": lat,
                        "lng": lng,
                        "categories": [category],

                        # 프론트 호환 필드 유지
                        "status": "available",
                        "price": 5500,
                        "rating": 4.6,
                        "distance": "",
                        "instagramHandle": "",
                    }

                    by_key[key] = store
                    next_id += 1
                    category_counts[category] += 1
                    new_added += 1

                    print(f"✅ NEW ADD {new_added}/{NEW_DAILY_TARGET}: {name} | {address}")

                time.sleep(0.2)

# -----------------------------
# ✅ 3) 누적 저장
# -----------------------------
stores = sorted(by_key.values(), key=lambda x: int(x.get("id", 0)))

with open(out_path, "w", encoding="utf-8") as f:
    json.dump(stores, f, ensure_ascii=False, indent=2)

print(f"✅ wrote {len(stores)} stores to {out_path} (today new: {new_added})")
print("✅ category_counts:", dict(category_counts))