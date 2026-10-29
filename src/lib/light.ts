/**
 * 하루의 빛: 시간대에 따라 화면 색을 바꾼다. 색 토큰은 src/app/globals.css에 있다.
 *
 * - 정하는 순서는 진행 중인 세션의 빛, 설정에서 고른 빛, 기기 시각이다.
 * - 기기 시각으로는 5시 mist(A 물안개), 12시 sunlit(B 볕), 18시 moonlight(C 달빛)이다.
 *   0~5시는 밝은 화면이 켜지지 않도록 moonlight다.
 * - 프로필의 피하고 싶은 색에 검정이나 진한 보라가 있으면 moonlight 대신 sunlit을 쓴다.
 * - 세션 중에는 바꾸지 않는다. 감상 전후 측정을 같은 화면에서 하기 위해서다. 세션의 빛은 세션 화면에서만 쓰므로
 *   세션을 마치지 않고 나가도 다른 화면은 시간대를 따른다.
 * - 켜 둔 채로 시간대가 바뀌어도 따라간다(src/app/light-sync.tsx).
 */

export const LIGHTS = ["mist", "sunlit", "moonlight"] as const;
export type Light = (typeof LIGHTS)[number];

export const LIGHT_KEYS = {
  session: "lumi:session-light",
  pick: "lumi:light-pick",
  avoidDark: "lumi:avoid-dark",
} as const;

/**
 * 빛을 정해 <html data-light>에 적고 돌려준다.
 * layout이 이 함수를 문자열로 바꿔 <head>에서 첫 화면 전에 실행하므로 바깥 변수를 쓰지 않는다.
 */
export function applyLight(keys: typeof LIGHT_KEYS): Light {
  let stored: string | null = null;
  let avoidDark = false;
  try {
    const session = location.pathname === "/session" ? sessionStorage.getItem(keys.session) : null;
    stored = session || localStorage.getItem(keys.pick);
    avoidDark = localStorage.getItem(keys.avoidDark) === "1";
  } catch {
    // 저장소를 막은 브라우저에서는 시각으로만 정한다.
  }
  let light: Light;
  if (stored === "mist" || stored === "sunlit" || stored === "moonlight") {
    light = stored;
  } else {
    const hour = new Date().getHours();
    light = hour >= 5 && hour < 12 ? "mist" : hour >= 12 && hour < 18 ? "sunlit" : "moonlight";
    if (light === "moonlight" && avoidDark) light = "sunlit";
  }
  document.documentElement.dataset.light = light;
  return light;
}

/** 브라우저 상단 색(theme-color)을 지금 화면 배경에 맞춘다. */
export function syncThemeColor(): void {
  const color = getComputedStyle(document.documentElement).getPropertyValue("--lumi-page").trim();
  if (!color) return;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.append(meta);
  }
  meta.content = color;
}

/** 빛을 다시 정하고 브라우저 상단 색을 맞춘다. 앱으로 돌아왔을 때 부른다. */
export function refreshLight(): Light {
  const light = applyLight(LIGHT_KEYS);
  syncThemeColor();
  return light;
}

/** 세션을 시작할 때 부른다. 마치지 않고 남은 앞 세션의 빛은 버리고, 마칠 때까지 지금 빛을 유지한다. */
export function lockLight(): Light {
  write("session", LIGHT_KEYS.session, null);
  const light = refreshLight();
  write("session", LIGHT_KEYS.session, light);
  return light;
}

/** 세션을 마치면 부른다. 다시 기기 시각을 따른다. */
export function unlockLight(): Light {
  write("session", LIGHT_KEYS.session, null);
  return refreshLight();
}

/** 설정의 화면 색. null이면 시간대를 따른다. 사용자가 고른 것이라 진행 중인 세션에도 바로 적용한다. */
export function pickLight(light: Light | null): Light {
  write("local", LIGHT_KEYS.pick, light);
  return relock();
}

/**
 * 프로필 avoided_colors에 검정이나 진한 보라가 있으면 true로 부른다(색 값 형식은 BE에서 아직 정하지 않았다).
 * 불편한 색을 계속 보여 주지 않도록 진행 중인 세션에도 바로 적용한다.
 */
export function setAvoidDark(avoid: boolean): Light {
  write("local", LIGHT_KEYS.avoidDark, avoid ? "1" : null);
  return relock();
}

// 세션 중이면 고정한 빛을 풀고 다시 정한 뒤 새 빛으로 다시 고정한다.
function relock(): Light {
  const locked = read("session", LIGHT_KEYS.session) !== null;
  if (locked) write("session", LIGHT_KEYS.session, null);
  const light = refreshLight();
  if (locked) write("session", LIGHT_KEYS.session, light);
  return light;
}

type Store = "local" | "session";

function storage(store: Store): Storage {
  return store === "session" ? sessionStorage : localStorage;
}

function read(store: Store, key: string): string | null {
  try {
    return storage(store).getItem(key);
  } catch {
    return null;
  }
}

function write(store: Store, key: string, value: string | null): void {
  try {
    if (value === null) storage(store).removeItem(key);
    else storage(store).setItem(key, value);
  } catch {
    // 저장소를 막은 브라우저에서는 지금 화면에만 적용된다.
  }
}
