import { productMetadata, productParams, renderProduct, type Params } from './product';

export const generateStaticParams = productParams;
export const generateMetadata = productMetadata;

export default async function ProductPage({ params }: Params) {
  return renderProduct((await params).id, false);
}
