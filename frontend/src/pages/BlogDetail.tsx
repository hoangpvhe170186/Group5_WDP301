import { useParams, Link } from "react-router-dom";
import { BLOGS } from "../data/blog";

export default function BlogDetail() {
  const { slug = "" } = useParams();

  const post = BLOGS[slug];
  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link to="/" className="text-sm text-gray-500 hover:underline">← Về trang chủ</Link>
        <h1 className="text-2xl font-bold mt-3">Bài viết không tồn tại hoặc đang cập nhật…</h1>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link to="/" className="text-sm text-gray-500 hover:underline">← Về trang chủ</Link>
      <h1 className="text-3xl font-bold text-gray-900 mt-3 mb-6">{post.title}</h1>
      <img src={post.cover} alt={post.title} className="rounded-lg mb-8" />
      <div className="space-y-4 text-gray-700 leading-relaxed">
        <p>{post.intro}</p>
        {post.sections?.map((sec, i) => (
          <section key={i} className="mt-4">
            {sec.heading && <h2 className="text-xl font-semibold mb-2">{sec.heading}</h2>}
            {sec.body && <p>{sec.body}</p>}
            {sec.bullets && (
              <ul className="list-disc pl-5 space-y-1">
                {sec.bullets.map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            )}
          </section>
        ))}
        {post.outro && <p className="mt-4">{post.outro}</p>}
      </div>
    </div>
  );
}
