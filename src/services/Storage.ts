// services/storageService.ts
import { useState, useEffect } from "react";

export function Storage() {
  const [files, setFiles] = useState<any[]>([]);
  const baseUrl = `/api/v1`;

  // 🔄 get all files
  const fetchFiles = async () => {
    const res = await fetch(baseUrl);
    const data = await res.json();
    setFiles(data);
  };

  // ⬆️ upload file
  const upload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${baseUrl}/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    fetchFiles();
    return data;
  };

  // ⬇️ download file
  const download = (id: string) => {
    window.open(`${baseUrl}/download/${id}`, "_blank");
  };

  // 🗑 delete file
  const remove = async (id: string) => {
    await fetch(`${baseUrl}/${id}`, { method: "DELETE" });
    fetchFiles();
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return { files, upload, download, remove };
}
