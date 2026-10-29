/** 배경 없는 선 그림. 선 색은 현재 화면의 테마 토큰을 따른다. */
const SHAPES: Record<string, string[]> = {
  SEE: [
    "M24 96Q72 28 120 28Q168 28 216 96Q168 164 120 164Q72 164 24 96Z",
    "M158 96A38 38 0 1 1 82 96A38 38 0 1 1 158 96Z",
    "M135 96A15 15 0 1 1 105 96A15 15 0 1 1 135 96Z",
  ],
  TOUCH: [
    "M70 100V46Q70 34 80 34Q90 34 90 46V90",
    "M90 90V30Q90 18 101 18Q112 18 112 30V89",
    "M112 89V37Q112 25 123 25Q134 25 134 37V92",
    "M134 92V53Q134 42 145 42Q156 42 156 53V121L178 98Q191 85 201 95Q210 104 199 116L166 163Q152 183 122 183H108Q78 183 63 158L44 126Q36 112 45 105Q54 99 62 112L76 130",
  ],
  HEAR: [
    "M78 126Q55 103 60 72Q65 34 106 31Q145 30 155 65Q165 94 145 111L128 126Q121 133 120 148Q119 166 103 174Q83 181 75 164",
    "M84 89Q78 66 96 56Q120 43 134 65Q146 83 126 97L111 109Q101 119 108 130",
    "M180 61Q205 90 180 120",
    "M197 43Q234 90 197 138",
  ],
  SMELL: [
    "M90 30Q94 63 111 86Q126 106 115 116L98 123Q92 127 101 136",
    "M76 155Q97 166 120 157",
    "M152 108Q164 122 152 138",
    "M173 92Q195 122 173 153",
    "M195 74Q229 122 195 172",
  ],
  TASTE: [
    "M25 88Q65 48 90 65Q120 83 150 65Q180 48 215 88Q170 143 120 143Q65 143 25 88Z",
    "M25 88Q75 110 120 98Q170 110 215 88",
  ],
};
export function SenseArt({ id, label, count }: { id: string; label: string; count: number }) {
  return (
    <div className="mx-auto flex h-[34dvh] min-h-48 max-h-80 w-full flex-col items-center justify-center gap-3">
      <span className="font-display text-title text-ink">{count}</span>
      <svg role="img" aria-label={label} viewBox="0 0 240 200"
        className="h-full min-h-0 w-60 max-w-full text-primary" fill="none"
        stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        {(SHAPES[id] ?? []).map((d, index) => <path key={index} d={d} />)}
      </svg>
    </div>
  );
}
