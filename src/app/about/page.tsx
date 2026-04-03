import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "О сайте — РадиоЗал",
  description:
    "РадиоЗал — бесплатный онлайн-сервис для прослушивания радиостанций со всего мира.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 pb-28 space-y-8">
      <h1 className="text-3xl font-bold">
        О сайте <span className="text-emerald-600">РадиоЗал</span>
      </h1>

      <section className="space-y-4 text-stone-600 leading-relaxed">
        <p>
          <strong className="text-stone-900">РадиоЗал</strong> — это бесплатный
          онлайн-сервис, который предоставляет доступ к тысячам радиостанций со
          всего мира. Музыка, новости, спорт, подкасты — всё в одном месте, без
          рекламы и регистрации.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 py-4">
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <span className="text-2xl mb-2 block">🌍</span>
            <h3 className="font-semibold text-stone-900 mb-1">Весь мир</h3>
            <p className="text-sm text-stone-400">
              Станции из более чем 200 стран — от местных до международных.
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <span className="text-2xl mb-2 block">🎵</span>
            <h3 className="font-semibold text-stone-900 mb-1">Все жанры</h3>
            <p className="text-sm text-stone-400">
              Поп, рок, джаз, классика, электроника, хип-хоп и многое другое.
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <span className="text-2xl mb-2 block">♥</span>
            <h3 className="font-semibold text-stone-900 mb-1">Избранное</h3>
            <p className="text-sm text-stone-400">
              Сохраняйте любимые станции и быстро к ним возвращайтесь.
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <span className="text-2xl mb-2 block">🔍</span>
            <h3 className="font-semibold text-stone-900 mb-1">Удобный поиск</h3>
            <p className="text-sm text-stone-400">
              Найдите станцию по названию, жанру или стране за секунду.
            </p>
          </div>
        </div>

        <p>
          Данные о радиостанциях предоставляются открытым API{" "}
          <a
            href="https://www.radio-browser.info/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:underline"
          >
            Radio Browser
          </a>
          . Это крупнейшая бесплатная база радиостанций в мире, поддерживаемая
          сообществом.
        </p>
      </section>
    </div>
  );
}
