import type { Station } from "./api";

function s(
  id: string,
  name: string,
  url_resolved: string,
  tags: string,
  favicon = "",
  bitrate = 128,
  codec = "MP3"
): Station {
  return {
    stationuuid: `curated-${id}`,
    name,
    url: url_resolved,
    url_resolved,
    favicon,
    tags,
    country: "Russia",
    countrycode: "RU",
    language: "russian",
    votes: 0,
    codec,
    bitrate,
  };
}

/** Hand-picked Russian stations with verified working streams */
export const CURATED_RU: Station[] = [
  s("zhara-fm", "Жара FM", "https://live1.zharafm.ru/internet", "pop,hits,russian", "https://zharafm.ru/favicon.ico"),
  s("remix-fm", "Remix FM", "https://rmx.amgradio.ru/RemixFM", "dance,remix,electronic"),
  s("dfm", "DFM", "https://dfm.hostingradio.ru/dfm128.mp3", "dance,electronic,hits", "https://dfm.ru/favicon.ico"),
  s("dfm-disco90", "DFM Дискач 90-х", "https://dfm-disc90.hostingradio.ru/disc9096.aacp", "disco,90s,dance", "https://dfm.ru/favicon.ico", 96, "AAC"),
  s("hit-fm", "Hit FM", "https://hitfm.hostingradio.ru/hitfm96.aacp", "pop,hits", "https://hitfm.ru/favicon.ico", 96, "AAC"),
  s("like-fm", "Like FM", "https://srv12.gpmradio.ru:8443/stream/air/aac/64/219", "pop,hits,russian", "https://cdn2.likefm.ru/design/images/design-images/img_for_sharing.png", 64, "AAC"),
  s("pioner-fm", "Пионер FM", "https://listen10.myradio24.com/pionerfm", "retro,80s,russian"),
  s("energy-nrj", "Радио ENERGY (NRJ)", "https://ic6.101.ru:8000/stream/air/aac/64/99", "pop,dance,hits", "https://api.radioplayer.ru/images/energy_colored.svg", 64, "AAC"),
  s("novoe-radio", "Новое Радио", "https://stream06.pcradio.ru/rad_ntrntrdnvrd-hi", "pop,hits,russian"),
  s("tnt-radio", "ТНТ Radio", "https://tntradio.hostingradio.ru:8027/tntradio128.mp3", "pop,hits,russian"),
  s("101ru-90s-pop", "101.ru: 90's Pop", "https://pub0202.101.ru:8443/stream/pro/aac/64/130", "90s,pop,retro", "https://101.ru/favicon.ico", 64, "AAC"),
  s("101ru-abba", "101.ru: ABBA", "https://ic6.101.ru:8000/stream/pro/aac/64/104", "abba,pop,disco", "https://101.ru/favicon.ico", 64, "AAC"),
  s("dfm-rusdance", "DFM Russian Dance", "https://dfm-dfmrusdance.hostingradio.ru/dfmrusdance96.aacp", "dance,russian,electronic", "https://dfm.ru/favicon.ico", 96, "AAC"),
  s("hype-fm", "Hype FM", "https://hfm.volna.top/HypeFM", "hip-hop,rap,rnb"),
];
