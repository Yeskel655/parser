import fastify from "fastify";
import { pdfGenerate } from "./utils/pdf_generator.js";
import { Heap } from "heap-js";
import { JSDOM } from "jsdom";

const server = fastify();

interface IQuerystring {
  url: string;
}

function* traverse(node: Document | ChildNode): Generator<string, undefined> {
  switch (node.nodeName) {
    case "#text":
      if (node.nodeValue) {
        yield node.nodeValue;
      }
      return;

    case "#comment":
    case "SCRIPT":
    case "STYLE":
      return;
  }

  for (const child of node.childNodes) {
    yield* traverse(child);
  }
}

async function getWordsFromUrl(url: string): Promise<string[]> {
  const NUM_WORDS = 10;

  const dom = await JSDOM.fromURL(url);
  dom.serialize();

  const heap = new Heap<string>((a: string, b: string) => a.length - b.length);
  for (const str of traverse(dom.window.document)) {
    const words = str
      .split(/[\n\s.,\/#!$%\^&\*;:{}=\-_`~()]+/)
      .filter((word: string) => word && !heap.contains(word));

    heap.push(...words);
    while (heap.size() > NUM_WORDS) {
      heap.pop();
    }
  }

  return heap.toArray();
}

server.get("/", async (request, reply) => {
  reply.type("text/html");
  reply.header("Content-Type", "text/html; charset=utf-8");
  reply.send(`
    <head>Введите URL</head>
    <body>
    <form method="get" action="/getLongWords">
 <input type="text" name="url" required />
 <input type="submit" value="Сгенерировать PDF" />
</form>
</body>`);
});

server.get<{ Querystring: IQuerystring }>(
  "/getLongWords",
  async (request, reply) => {
    try {
      const { url } = request.query;
      const strArray = await getWordsFromUrl(url);
      const doc = await pdfGenerate(strArray);
      reply.type("application/pdf");
      reply.header(
        "content-disposition",
        `attachment; filename="longWords.pdf"`
      );
      await reply.send(doc);
    } catch (error) {
      console.error(error);
      throw new Error();
    }
  }
);

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
