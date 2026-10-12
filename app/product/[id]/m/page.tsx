// Мобильная вёрстка страницы товара: сюда proxy.ts переписывает /product/:id для телефонов (адрес в браузере прежний).
// Метаданные те же, canonical — /product/:id.
import { productMetadata, productParams, renderProduct, type Params } from '../product';

export const generateStaticParams = productParams;
export const generateMetadata = productMetadata;

export default async function ProductPageMobile({ params }: Params) {
  return renderProduct((await params).id, true);
}
