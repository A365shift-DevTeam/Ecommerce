import { HeroScroll } from "../components/home/HeroScroll";
import {
  Bestsellers,
  CategoryCircles,
  CustomerReviews,
  FeaturedCollections,
  NewArrivals,
  OfferBand,
  PromoTiles,
  ServiceBand,
  ShopByPrice,
  StudioIntro,
  TrustStrip,
} from "../components/home/sections";

export default function Home() {
  return (
    <>
      <h1 className="sr-only">Gruham: silk sarees, half sarees and jewellery</h1>
      {/* The hero plays its frames first; the sections below only scroll in after it. */}
      <HeroScroll mobileContent={<StudioIntro />} />
      <TrustStrip />
      <CategoryCircles />
      <FeaturedCollections />
      <PromoTiles />
      <Bestsellers />
      <ShopByPrice />
      <OfferBand />
      <NewArrivals />
      <CustomerReviews />
      <ServiceBand />
    </>
  );
}
