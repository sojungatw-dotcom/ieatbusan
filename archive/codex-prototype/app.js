"use strict";

// 아래 데이터만 교체하면 음식 정보와 사진을 수정할 수 있습니다.
// image에 실제 사진의 로컬 경로(예: images/gukbap.jpg)를 넣으세요.
const foods = [
  { id: "gukbap", name: "돼지국밥", region: "부산", area: "부산", image: "",
    description: "돼지고기와 국물, 밥을 함께 즐기는 부산의 대표적인 음식입니다.",
    ingredients: "돼지고기, 밥, 육수, 부추 등 (식당별 상이)",
    how: ["국물을 먼저 맛봅니다.", "기호에 맞게 양념을 조금씩 더합니다.", "고기와 밥, 곁들임을 함께 즐깁니다."],
    allergens: ["돼지고기", "새우젓의 새우", "양념에 포함될 수 있는 대두·밀"],
    caution: "새우젓과 양념은 식당마다 다르게 제공됩니다. 포함 재료를 확인하세요." },
  { id: "milmyeon", name: "밀면", region: "부산", area: "부산", image: "",
    description: "밀가루 면에 육수 또는 비빔 양념을 곁들여 먹는 음식입니다.",
    ingredients: "밀가루 면, 육수, 오이, 고명, 양념 등 (식당별 상이)",
    how: ["육수나 양념을 먼저 맛봅니다.", "기호에 맞게 식초와 겨자를 조금씩 넣습니다.", "면과 고명을 함께 먹습니다."],
    allergens: ["밀", "고명에 포함될 수 있는 달걀", "육수·양념에 포함될 수 있는 대두·육류"],
    caution: "물밀면과 비빔밀면의 재료가 다를 수 있습니다. 고명과 육수도 함께 확인하세요." },
  { id: "pajeon", name: "동래파전", region: "부산", area: "부산 동래", image: "",
    description: "파와 여러 재료를 반죽과 함께 부쳐 먹는 동래 지역의 음식입니다.",
    ingredients: "파, 반죽, 해산물, 달걀 등 (식당별 상이)",
    how: ["먹기 좋은 크기로 나눕니다.", "파와 곁들여진 재료를 함께 집습니다.", "제공되는 소스를 기호에 맞게 곁들입니다."],
    allergens: ["반죽에 포함될 수 있는 밀", "달걀", "해산물 및 소스의 재료 확인 필요"],
    caution: "해산물의 종류와 반죽 재료가 식당마다 다릅니다. 소스의 성분도 확인하세요." },
  { id: "bibimbap", name: "진주비빔밥", region: "경남", area: "경남 진주", image: "",
    description: "밥에 여러 나물과 고명을 올려 비벼 먹는 진주 지역의 음식입니다.",
    ingredients: "밥, 나물, 고추장, 고기 고명 등 (식당별 상이)",
    how: ["나물과 고명을 살펴봅니다.", "양념을 조금씩 넣어 비빕니다.", "함께 나오는 국이나 반찬을 곁들입니다."],
    allergens: ["고명에 포함될 수 있는 쇠고기·달걀", "장류에 포함될 수 있는 대두·밀"],
    caution: "육회가 올라가는 메뉴인지, 고명을 익혀 제공할 수 있는지 주문 전에 확인하세요." },
  { id: "gimbap", name: "충무김밥", region: "경남", area: "경남 통영", image: "",
    description: "작게 싼 김밥을 매콤한 반찬과 함께 먹는 통영 지역의 음식입니다.",
    ingredients: "김, 밥, 오징어 반찬, 무김치 등 (식당별 상이)",
    how: ["김밥을 한 입 먹습니다.", "오징어 반찬이나 무김치를 곁들입니다.", "반찬의 양으로 매운맛을 조절합니다."],
    allergens: ["오징어", "어묵에 포함될 수 있는 생선·밀·대두", "젓갈의 원재료 확인 필요"],
    caution: "반찬과 젓갈의 종류, 양념 재료를 확인하세요." },
  { id: "agujjim", name: "마산아귀찜", region: "경남", area: "경남 창원 마산", image: "",
    description: "아귀와 콩나물 등을 양념해 쪄내는 마산 지역의 음식입니다.",
    ingredients: "아귀, 콩나물, 미나리, 양념 등 (식당별 상이)",
    how: ["주문할 때 매운맛의 정도를 확인합니다.", "아귀 살과 채소를 함께 먹습니다.", "먹기 전에 뼈가 있는지 살펴봅니다."],
    allergens: ["아귀(생선)", "양념에 포함될 수 있는 대두·밀", "추가 해산물의 종류 확인 필요"],
    caution: "뼈와 매운 양념에 주의하고, 추가 해산물과 양념 성분을 확인하세요." }
];

const $ = (selector) => document.querySelector(selector);
const storageKey = "local-food-basic-posts-v1";
let posts = [];
let storageAvailable = true;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
  if (Array.isArray(saved)) posts = saved.filter(post => post &&
    ["id", "category", "author", "title", "body", "createdAt"].every(key => typeof post[key] === "string"));
} catch { storageAvailable = false; }

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function setPhoto(img, food) {
  // 실제 음식 사진이 없는 상태를 명확히 표시합니다. 외부 이미지 의존성이 없습니다.
  const placeholder = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="28" fill="#555">음식 사진 준비 중</text></svg>';
  const fallback = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(placeholder);
  img.alt = food.image ? `${food.name} 사진` : `${food.name} 사진 준비 중`;
  img.onerror = () => { img.onerror = null; img.src = fallback; img.alt = `${food.name} 사진 준비 중`; };
  img.src = food.image || fallback;
}

// 추천 영역에는 5개만 표시합니다. 아래 목록의 검색·지역 필터와는 별도로 동작합니다.
const featuredFoods = foods.slice(0, 5);
let featuredIndex = 0;

function updateFeaturedControls() {
  $("#featured-count").textContent = `${featuredIndex + 1} / ${featuredFoods.length}`;
  $("#featured-prev").disabled = featuredIndex === 0;
  $("#featured-next").disabled = featuredIndex === featuredFoods.length - 1;
  Array.from($("#featured-pages").children).forEach((button, index) => {
    if (index === featuredIndex) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
}

function moveFeatured(index) {
  const track = $("#featured-track");
  const target = Math.max(0, Math.min(index, featuredFoods.length - 1));
  track.scrollTo({ left: target * track.clientWidth,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

function renderFeatured() {
  $("#featured-track").replaceChildren();
  $("#featured-pages").replaceChildren();
  featuredFoods.forEach((food, index) => {
    const slide = element("article", undefined, "featured-slide");
    slide.setAttribute("aria-roledescription", "슬라이드");
    slide.setAttribute("aria-label", `${index + 1} / ${featuredFoods.length}: ${food.name}`);
    const link = element("a");
    link.href = `#food/${food.id}`;
    const img = element("img");
    img.loading = index === 0 ? "eager" : "lazy";
    setPhoto(img, food);
    const info = element("div", undefined, "featured-info");
    info.append(element("h3", food.name), element("p", food.area),
      element("p", food.description), element("span", "상세 정보 보기 →"));
    link.append(img, info);
    slide.append(link);
    $("#featured-track").append(slide);
    const page = element("button", String(index + 1));
    page.type = "button";
    page.setAttribute("aria-label", `${food.name} 보기 (${index + 1} / ${featuredFoods.length})`);
    page.setAttribute("aria-controls", "featured-track");
    page.addEventListener("click", () => moveFeatured(index));
    $("#featured-pages").append(page);
  });
  updateFeaturedControls();
}

function renderFoods() {
  const query = $("#query").value.trim().toLowerCase();
  const region = $("#region").value;
  const result = foods.filter(food => (region === "전체" || food.region === region) &&
    `${food.name} ${food.area}`.toLowerCase().includes(query));
  $("#food-list").replaceChildren();
  $("#result-count").textContent = `${result.length}개의 음식`;
  result.forEach(food => {
    const card = element("article", undefined, "food-card");
    const link = element("a");
    link.href = `#food/${food.id}`;
    const img = element("img");
    img.loading = "lazy";
    setPhoto(img, food);
    link.append(img, element("h2", food.name), element("p", food.area), element("p", food.description));
    card.append(link);
    $("#food-list").append(card);
  });
  if (!result.length) $("#food-list").append(element("p", "검색 결과가 없습니다. 다른 검색어나 지역을 선택하세요."));
}

function renderDetail(food) {
  $("#detail-title").textContent = food.name;
  $("#detail-region").textContent = food.area;
  setPhoto($("#detail-image"), food);
  $("#detail-description").textContent = food.description;
  $("#detail-ingredients").textContent = `주요 재료 예시: ${food.ingredients}`;
  $("#detail-how").replaceChildren(...food.how.map(text => element("li", text)));
  $("#detail-allergens").replaceChildren(...food.allergens.map(text => element("li", text)));
  $("#detail-caution").textContent = food.caution;
  const restaurant = element("article", undefined, "restaurant");
  restaurant.append(element("h3", `[가상] ${food.name} 예시 식당`),
    element("p", `지역: ${food.area} (상세 주소 미등록)`),
    element("p", `판매 메뉴: ${food.name}`),
    element("p", "전화번호·영업시간: 실제 데이터 등록 예정"));
  $("#restaurant-list").replaceChildren(restaurant);
  $("#restaurant-search").href = `https://map.naver.com/p/search/${encodeURIComponent(`${food.area} ${food.name}`)}`;
}

function renderPosts() {
  $("#post-list").replaceChildren();
  if (!posts.length) $("#post-list").append(element("p", "아직 게시글이 없습니다. 첫 글을 남겨보세요."));
  posts.forEach(post => {
    const article = element("article", undefined, "post");
    const date = new Date(post.createdAt);
    const dateText = Number.isNaN(date.getTime()) ? "날짜 없음" : date.toLocaleString("ko-KR");
    const remove = element("button", "글 삭제");
    remove.type = "button";
    remove.dataset.deleteId = post.id;
    remove.setAttribute("aria-label", `${post.title} 글 삭제`);
    article.append(element("h3", `[${post.category}] ${post.title}`),
      element("p", `${post.author} · ${dateText}`), element("p", post.body, "post-body"), remove);
    $("#post-list").append(article);
  });
}

function savePosts(nextPosts) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(nextPosts));
    storageAvailable = true;
    return true;
  } catch {
    $("#community-status").textContent = "브라우저 저장소를 사용할 수 없어 변경사항을 저장하지 못했습니다. 저장소 설정이나 여유 공간을 확인하세요.";
    return false;
  }
}

function route() {
  const hash = location.hash || "#foods";
  const food = foods.find(item => hash === `#food/${item.id}`);
  const view = food ? "detail" : hash === "#community" ? "community" : "foods";
  ["foods", "detail", "community"].forEach(name => { $(`#${name}-view`).hidden = name !== view; });
  if (food) renderDetail(food);
  if (view === "community") renderPosts();
  document.title = `${food ? food.name : view === "community" ? "커뮤니티" : "음식 목록"} | 부산·경남 향토음식`;
  const heading = $(`#${view}-title`);
  heading.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

$("#search-form").addEventListener("submit", event => { event.preventDefault(); renderFoods(); });
$("#region").addEventListener("change", renderFoods);
$("#query").addEventListener("input", renderFoods);
$("#featured-prev").addEventListener("click", () => moveFeatured(featuredIndex - 1));
$("#featured-next").addEventListener("click", () => moveFeatured(featuredIndex + 1));
$("#featured-track").addEventListener("scroll", () => {
  const track = $("#featured-track");
  if (!track.clientWidth) return;
  const index = Math.max(0, Math.min(featuredFoods.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
  if (index === featuredIndex) return;
  featuredIndex = index;
  updateFeaturedControls();
}, { passive: true });
$("#featured-track").addEventListener("keydown", event => {
  const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
  if (!delta) return;
  event.preventDefault();
  moveFeatured(featuredIndex + delta);
});
window.addEventListener("resize", () => {
  const track = $("#featured-track");
  if (track.clientWidth) track.scrollTo({ left: featuredIndex * track.clientWidth, behavior: "instant" });
});
$("#detail-nav").addEventListener("click", event => {
  const button = event.target.closest("button[data-section]");
  if (!button) return;
  const heading = document.getElementById(button.dataset.section);
  heading.focus({ preventScroll: true });
  heading.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
});
$("#post-form").addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const post = Object.fromEntries(["category", "author", "title", "body"].map(key => [key, String(data.get(key) || "").trim()]));
  if (!post.author || !post.title || !post.body) {
    $("#community-status").textContent = "닉네임, 제목, 내용을 공백 없이 입력하세요.";
    return;
  }
  post.id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  post.createdAt = new Date().toISOString();
  const nextPosts = [post, ...posts];
  if (!savePosts(nextPosts)) return;
  posts = nextPosts;
  form.reset();
  renderPosts();
  $("#community-status").textContent = "글을 이 브라우저에 저장했습니다.";
});
$("#post-list").addEventListener("click", event => {
  const button = event.target.closest("button[data-delete-id]");
  if (!button || !window.confirm("이 게시글을 삭제할까요?")) return;
  const nextPosts = posts.filter(post => post.id !== button.dataset.deleteId);
  if (!savePosts(nextPosts)) return;
  posts = nextPosts;
  renderPosts();
  $("#community-status").textContent = "게시글을 삭제했습니다.";
});
window.addEventListener("hashchange", route);
if (!storageAvailable) $("#community-status").textContent = "저장된 글을 불러오지 못했습니다. 브라우저 저장소 설정을 확인하세요.";
renderFeatured();
renderFoods();
route();
