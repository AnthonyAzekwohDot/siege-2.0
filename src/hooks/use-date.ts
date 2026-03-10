"use client";

import { useState } from "react";
import { format } from "date-fns";

export function useDate() {
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  return { date, setDate };
}
