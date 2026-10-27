/**
 * SSE 읽기: 브라우저 EventSource는 GET만 되므로 POST 응답 본문을 fetch로 직접 읽는다(BE README 「SSE」).
 *
 * BE는 `event: 이름\ndata: JSON\n\n`만 보내고, 15초 동안 이벤트가 없으면 하트비트 주석(`: ping`)을 보낸다.
 * 이벤트는 session → progress … → result 순서이고, 실패하면 error로 끝난다.
 */

export type SseEvent = { event: string; data: string };

/** 조각난 텍스트를 받아 끝난 이벤트만 돌려준다. 덜 온 이벤트는 다음 push까지 들고 있는다. */
export function createSseParser(): { push(chunk: string): SseEvent[]; flush(): SseEvent[] } {
  let buffer = "";
  return {
    push(chunk) {
      buffer += chunk;
      // 줄바꿈을 \n으로 맞춘다. 끝의 \r은 다음 조각의 \n과 짝일 수 있어 남겨 둔다.
      const tail = buffer.endsWith("\r") ? "\r" : "";
      buffer = buffer.slice(0, buffer.length - tail.length).replace(/\r\n?/g, "\n") + tail;
      const events: SseEvent[] = [];
      let end = buffer.indexOf("\n\n");
      while (end !== -1) {
        const event = parseBlock(buffer.slice(0, end));
        if (event) events.push(event);
        buffer = buffer.slice(end + 2);
        end = buffer.indexOf("\n\n");
      }
      return events;
    },
    flush() {
      const event = parseBlock(buffer.replace(/\r\n?/g, "\n"));
      buffer = "";
      return event ? [event] : [];
    },
  };
}

/** 이벤트 하나. data가 없는 블록(하트비트 주석 등)은 null이다. */
function parseBlock(block: string): SseEvent | null {
  let event = "message";
  const data: string[] = [];
  for (const line of block.split("\n")) {
    if (!line || line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
  }
  return data.length ? { event, data: data.join("\n") } : null;
}

/** 응답 본문을 끝까지 읽으며 이벤트마다 onEvent를 부른다. */
export async function readSse(response: Response, onEvent: (event: SseEvent) => void): Promise<void> {
  if (!response.body) return;
  const parser = createSseParser();
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.push(value).forEach(onEvent);
  }
  parser.flush().forEach(onEvent);
}
