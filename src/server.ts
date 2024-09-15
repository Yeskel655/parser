import fastify from "fastify";
import { pdfGenerate } from "./utils/pdf_generator.js";
import axios from "axios";
import jsdom from "jsdom";
import { convert } from "html-to-text";

const server = fastify();

interface IQuerystring {
  url: string;
}

server.get<{ Querystring: IQuerystring }>(
  "/getLongWords",
  async (response, reply) => {
    const { url } = response.query;
    const responseFromAxios = await axios.get(url);
    const { JSDOM } = jsdom;
    const dom = new JSDOM(responseFromAxios.data);
    const tags = dom.window.document.body.querySelectorAll("p");
    let str = "";
    for (const element of tags) {
      if (element.textContent) {
        console.log(element.textContent);
        str = str + element.textContent.replace(/[^a-zа-яё\s-]/gi, "");
      }
    }
    const text = convert(responseFromAxios.data, { wordwrap: 130 });
    console.log(text);
    const buffer = await pdfGenerate(
      str
        .split(" ")
        .sort(function (a, b) {
          return b.length - a.length;
        })
        .slice(0, 10)
    );
    reply.type("application/pdf");
    reply.header("content-disposition", `attachment; filename="longWords.pdf"`);
    reply.send(buffer);
  }
);

server.get<{ Querystring: IQuerystring }>(
  "/getJSDOM",
  async (response, reply) => {
    const { url } = response.query;
    const { JSDOM } = jsdom;
    const jsdom2 = await JSDOM.fromURL(url);
    console.log(jsdom2.window.document.body.querySelector("p")?.textContent);
  }
);

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
