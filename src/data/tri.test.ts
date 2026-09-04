import { describe, expect, it } from "vitest";
import { L, tri } from "@/data/tri";
import { resolve } from "@/i18n/locale";

describe("tri", () => {
  it("still builds an en/zh-Hant/zh-Hans object", () => {
    const s = tri("Hello", "你好(繁)", "你好(简)");
    expect(resolve(s, "en")).toBe("Hello");
    expect(resolve(s, "zh-Hant")).toBe("你好(繁)");
    expect(resolve(s, "zh-Hans")).toBe("你好(简)");
  });

  it("falls back to English for fr/pa, which tri() never sets", () => {
    const s = tri("Hello", "你好(繁)", "你好(简)");
    expect(resolve(s, "fr")).toBe("Hello");
    expect(resolve(s, "pa")).toBe("Hello");
  });
});

describe("L", () => {
  it("carries a translation for every locale it is given", () => {
    const s = L({ en: "Hello", fr: "Bonjour", pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ" });
    expect(resolve(s, "en")).toBe("Hello");
    expect(resolve(s, "fr")).toBe("Bonjour");
    expect(resolve(s, "pa")).toBe("ਸਤ ਸ੍ਰੀ ਅਕਾਲ");
  });

  it("falls back to English when a locale is omitted", () => {
    const s = L({ en: "Hello", fr: "Bonjour" });
    expect(resolve(s, "pa")).toBe("Hello");
  });
});
