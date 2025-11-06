"use client";

import { useState } from "react";

export default function PDFUpload() {
  return (
    <div>
      <h1>Upload PDF</h1>
      <input type="file" accept=".pdf" />
    </div>
  );
}
