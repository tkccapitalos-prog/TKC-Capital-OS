import type { Metadata } from "next";
import HotelOperationsClient from "./HotelOperationsClient";

export const metadata: Metadata = {
  title: "Opérations hôtelières",
  description: "Chambres, tâches, équipes, documents et chat par service.",
};

export default function HotelPage() {
  return <HotelOperationsClient />;
}
