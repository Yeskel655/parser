import fastify from "fastify";
import { pdfGenerate } from "./utils/pdf_generator.js";
import { getWordsFromUrl } from "./utils/get_words.js";

const server = fastify();

interface IQuerystring {
  url: string;
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
    const { url } = request.query;
    const strArray = await getWordsFromUrl(url);
    const doc = await pdfGenerate(strArray);
    reply.type("application/pdf");
    reply.header("content-disposition", `attachment; filename="longWords.pdf"`);
    await reply.send(doc);
    throw new Error();
  }
);

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
