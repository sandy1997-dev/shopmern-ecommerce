// Stub pages - each would be a full implementation in production
// These give the project structure without bloating the codebase

// Home.js
export const HomeStub = `
import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsAPI } from "../api";
import { useCartStore } from "../store";
import { motion } from "framer-motion";

export default function Home() {
  const { data } = useQuery({ queryKey: ["featured"], queryFn: () => productsAPI.getFeatured().then(r => r.data) });
  const { addItem, openCart } = useCartStore();
  // ... full hero, featured products, categories grid, testimonials
}
`;
