self.__uv$config = {
  prefix: "/service/",
  bare: [
    "https://uv.holyubofficial.net/",
    "https://bare.dothq.co/v1/",
  ],
  encodeUrl: Ultraviolet.codec.xor.encode,
  decodeUrl: Ultraviolet.codec.xor.decode,
  handler: "/uv/uv.handler.js",
  client: "/uv/uv.client.js",
  bundle: "/uv/uv.bundle.js",
  config: "/uv/uv.config.js",
  sw: "/uv/uv.sw.js",
};
