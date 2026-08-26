import type { Metadata } from "next";
import HotelOperationsClient from "./HotelOperationsClient";

export const metadata: Metadata = {
  title: "Operacoes hoteleiras",
  description: "Quartos, tarefas, equipas, documentos e chat por departamento.",
};

export default function HotelPage() {
  return <HotelOperationsClient />;
}
