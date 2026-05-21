import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, orderBy, query as firestoreQuery, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, MessageCircle, Phone, Send, Search, PackageCheck, Truck, Star, ShieldCheck, X, Plus, Minus, ClipboardList, Download, Filter, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// 1) Встанови пакет: npm install firebase
// 2) Встав сюди firebaseConfig з Firebase Console → Project settings → Your apps → Web app.
const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const initialProducts = [
  {
    id: 1,
    name: "Літня сукня Candy Pink",
    category: "Жіноче",
    price: 799,
    oldPrice: 1099,
    sizes: ["S", "M", "L"],
    colors: ["Рожевий", "Білий"],
    tag: "Хіт Reels",
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 2,
    name: "Сорочка Oversize Lemon",
    category: "Жіноче",
    price: 650,
    oldPrice: 890,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Жовтий", "Білий"],
    tag: "Новинка",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 3,
    name: "Джинси Blue Street",
    category: "Жіноче",
    price: 1190,
    oldPrice: 1490,
    sizes: ["XS", "S", "M", "L"],
    colors: ["Синій"],
    tag: "Топ продажів",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 4,
    name: "Біла базова футболка",
    category: "Чоловіче",
    price: 420,
    oldPrice: 590,
    sizes: ["M", "L", "XL", "XXL"],
    colors: ["Білий", "Чорний"],
    tag: "База",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 5,
    name: "Костюм Sport Casual",
    category: "Акції",
    price: 1390,
    oldPrice: 1890,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Беж", "Сірий"],
    tag: "-26%",
    image: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 6,
    name: "Сумка Mini Hot Pink",
    category: "Новинки",
    price: 540,
    oldPrice: 760,
    sizes: ["One size"],
    colors: ["Рожевий"],
    tag: "WOW",
    image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?q=80&w=1200&auto=format&fit=crop"
  }
];

const categories = ["Всі", "Новинки", "Жіноче", "Чоловіче", "Акції"];
const statuses = ["Нове", "В роботі", "Відправлено", "Завершено"];

function money(value) {
  return new Intl.NumberFormat("uk-UA").format(value) + " грн";
}

export default function TviyOdyagLandingCRM() {
  const [activeCategory, setActiveCategory] = useState("Всі");
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCrm, setShowCrm] = useState(false);
  const [products, setProducts] = useState(initialProducts);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Жіноче",
    price: "",
    oldPrice: "",
    sizes: "S,M,L",
    colors: "",
    tag: "Новинка",
    image: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [orders, setOrders] = useState([
    { id: 1001, name: "Марія", phone: "+380 67 123 45 67", product: "Літня сукня Candy Pink", qty: 1, size: "M", city: "Львів", status: "Нове", total: 799 },
    { id: 1002, name: "Оксана", phone: "+380 93 555 11 22", product: "Джинси Blue Street", qty: 1, size: "S", city: "Тернопіль", status: "В роботі", total: 1190 }
  ]);
  const [form, setForm] = useState({ name: "", phone: "", city: "", delivery: "", size: "", qty: 1, comment: "" });

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const byCategory = activeCategory === "Всі" || p.category === activeCategory || (activeCategory === "Новинки" && p.tag === "Новинка");
      const byQuery = p.name.toLowerCase().includes(query.toLowerCase());
      return byCategory && byQuery;
    });
  }, [activeCategory, query]);

  const currentTotal = selectedProduct ? selectedProduct.price * Number(form.qty || 1) : 0;

  useEffect(() => {
    const productsQuery = firestoreQuery(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
      const firebaseProducts = snapshot.docs.map((item) => ({
        firebaseId: item.id,
        ...item.data()
      }));

      if (firebaseProducts.length > 0) {
        setProducts(firebaseProducts);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const ordersQuery = firestoreQuery(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const firebaseOrders = snapshot.docs.map((item) => ({
        firebaseId: item.id,
        ...item.data()
      }));

      if (firebaseOrders.length > 0) {
        setOrders(firebaseOrders);
      }
    });

    return () => unsubscribe();
  }, []);

  function openOrder(product) {
    setSelectedProduct(product);
    setForm((prev) => ({ ...prev, size: product.sizes[0], qty: 1 }));
  }

  async function createOrder(e) {
    e.preventDefault();
    if (!selectedProduct || !form.name || !form.phone) return;

    const order = {
      id: Date.now(),
      name: form.name,
      phone: form.phone,
      product: selectedProduct.name,
      productId: selectedProduct.firebaseId || selectedProduct.id,
      qty: Number(form.qty || 1),
      size: form.size,
      city: form.city,
      delivery: form.delivery,
      comment: form.comment,
      status: "Нове",
      total: currentTotal,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "orders"), order);
    setSelectedProduct(null);
    setForm({ name: "", phone: "", city: "", delivery: "", size: "", qty: 1, comment: "" });
    setShowCrm(true);
  }

  async function changeStatus(order, status) {
    if (!order.firebaseId) return;
    await updateDoc(doc(db, "orders", order.firebaseId), { status });
  }

  async function addProduct(e) {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || (!newProduct.image && !imageFile)) return;

    setUploading(true);

    let imageUrl = newProduct.image;

    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`;
      const imageRef = ref(storage, `products/${fileName}`);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);
    }

    const product = {
      id: Date.now(),
      name: newProduct.name,
      category: newProduct.category,
      price: Number(newProduct.price),
      oldPrice: Number(newProduct.oldPrice || newProduct.price),
      sizes: newProduct.sizes.split(",").map((s) => s.trim()).filter(Boolean),
      colors: newProduct.colors.split(",").map((c) => c.trim()).filter(Boolean),
      tag: newProduct.tag || "Новинка",
      image: imageUrl,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "products"), product);
    setNewProduct({ name: "", category: "Жіноче", price: "", oldPrice: "", sizes: "S,M,L", colors: "", tag: "Новинка", image: "" });
    setImageFile(null);
    setUploading(false);
  }

  async function deleteProduct(product) {
    if (!product.firebaseId) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      return;
    }

    await deleteDoc(doc(db, "products", product.firebaseId));
  }

  function exportOrders() {
    const header = "ID;Ім'я;Телефон;Товар;Кількість;Розмір;Місто;Статус;Сума\n";
    const rows = orders.map((o) => `${o.id};${o.name};${o.phone};${o.product};${o.qty};${o.size};${o.city};${o.status};${o.total}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tviy-odyag-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-amber-50 text-zinc-950">
      <header className="sticky top-0 z-40 border-b border-rose-100 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-pink-600 to-amber-300 text-lg font-black text-white shadow-lg shadow-pink-200">ТО</div>
            <div>
              <p className="text-lg font-black leading-tight">Твій Одяг</p>
              <p className="text-xs font-medium text-zinc-500">стиль • якість • доставка</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-zinc-600 md:flex">
            <a href="#catalog" className="hover:text-pink-600">Каталог</a>
            <a href="#why" className="hover:text-pink-600">Переваги</a>
            <button onClick={() => setShowCrm(true)} className="hover:text-pink-600">CRM</button>
          </nav>
          <Button onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })} className="rounded-2xl bg-pink-600 px-5 font-bold hover:bg-pink-700">
            Купити
          </Button>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 md:grid-cols-2 md:px-6 md:py-16">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white px-4 py-2 text-sm font-bold text-pink-700 shadow-sm">
              <Star className="h-4 w-4 fill-pink-600" /> Продажі напряму з Facebook Reels
            </div>
            <h1 className="max-w-xl text-5xl font-black tracking-tight md:text-7xl">
              Твій <span className="bg-gradient-to-r from-pink-600 to-amber-400 bg-clip-text text-transparent">Одяг</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg font-medium leading-8 text-zinc-600">
              Яскравий односторінковий магазин для швидких замовлень після Reels: товар, кнопка, заявка, CRM. Без зайвої ходьби по сайту — клієнт купує, поки ще гарячий.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })} className="h-14 rounded-2xl bg-pink-600 px-7 text-base font-black hover:bg-pink-700">
                <ShoppingBag className="mr-2 h-5 w-5" /> Дивитись товари
              </Button>
              <Button variant="outline" className="h-14 rounded-2xl border-pink-200 px-7 text-base font-black hover:bg-pink-50">
                <MessageCircle className="mr-2 h-5 w-5" /> Messenger
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              {["500+ замовлень", "1–3 дні доставка", "Обмін розміру"].map((item) => (
                <div key={item} className="rounded-3xl bg-white p-4 text-sm font-black shadow-sm ring-1 ring-zinc-100">{item}</div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55 }} className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-pink-300 via-amber-200 to-white blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-2xl">
              <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1400&auto=format&fit=crop" alt="fashion banner" className="h-[430px] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-700/75 via-transparent to-amber-300/35" />
              <div className="absolute bottom-6 left-6 right-6 rounded-3xl bg-white/90 p-5 backdrop-blur-xl">
                <p className="text-sm font-black uppercase tracking-[0.25em] text-pink-600">нова колекція</p>
                <p className="mt-1 text-3xl font-black">Стиль, який продається з першого кліку</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="catalog" className="mx-auto max-w-7xl px-4 py-10 md:px-6">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-black text-pink-600">Каталог</p>
              <h2 className="text-4xl font-black tracking-tight">Товари для Reels-продажів</h2>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-zinc-100">
              <Search className="ml-2 h-5 w-5 text-zinc-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Пошук товару" className="h-10 w-full bg-transparent pr-3 outline-none md:w-64" />
            </div>
          </div>

          <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-black transition ${activeCategory === cat ? "bg-pink-600 text-white shadow-lg shadow-pink-200" : "bg-white text-zinc-700 ring-1 ring-zinc-100 hover:bg-pink-50"}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <motion.div key={product.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="group overflow-hidden rounded-[2rem] border-0 bg-white shadow-sm ring-1 ring-zinc-100 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-pink-100">
                  <div className="relative h-80 overflow-hidden">
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute left-4 top-4 rounded-full bg-pink-600 px-4 py-2 text-xs font-black text-white shadow-lg">{product.tag}</div>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black">{product.name}</h3>
                        <p className="mt-1 text-sm font-semibold text-zinc-500">{product.category} • {product.sizes.join(" / ")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-pink-600">{money(product.price)}</p>
                        <p className="text-sm font-bold text-zinc-400 line-through">{money(product.oldPrice)}</p>
                      </div>
                    </div>
                    <Button onClick={() => openOrder(product)} className="mt-5 h-12 w-full rounded-2xl bg-zinc-950 font-black hover:bg-pink-600">
                      Замовити
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="why" className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              [Truck, "Швидка доставка", "Нова Пошта / Укрпошта"],
              [ShieldCheck, "Безпечна покупка", "Підтвердження телефоном"],
              [PackageCheck, "Обмін розміру", "Зручно для клієнта"],
              [ClipboardList, "CRM замовлень", "Статуси й експорт"],
            ].map(([Icon, title, text]) => (
              <div key={title} className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-zinc-100">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-pink-50 text-pink-600"><Icon className="h-6 w-6" /></div>
                <h3 className="text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm font-medium text-zinc-500">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-md gap-2 rounded-3xl bg-white/90 p-2 shadow-2xl ring-1 ring-zinc-100 backdrop-blur-xl md:left-auto md:right-6">
        <Button onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })} className="flex-1 rounded-2xl bg-pink-600 font-black hover:bg-pink-700"><ShoppingBag className="mr-2 h-4 w-4" /> Замовити</Button>
        <Button variant="outline" className="rounded-2xl border-zinc-200"><Phone className="h-4 w-4" /></Button>
        <Button onClick={() => setShowCrm(true)} variant="outline" className="rounded-2xl border-zinc-200"><ClipboardList className="h-4 w-4" /></Button>
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <motion.div className="fixed inset-0 z-[60] grid place-items-end bg-black/45 p-3 backdrop-blur-sm md:place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
              <div className="grid md:grid-cols-2">
                <div className="relative min-h-[340px]">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="h-full min-h-[340px] w-full rounded-t-[2rem] object-cover md:rounded-l-[2rem] md:rounded-tr-none" />
                  <button onClick={() => setSelectedProduct(null)} className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white shadow-lg"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={createOrder} className="p-6 md:p-8">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-pink-600">швидке замовлення</p>
                  <h3 className="mt-2 text-3xl font-black">{selectedProduct.name}</h3>
                  <p className="mt-2 text-2xl font-black text-pink-600">{money(currentTotal)}</p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <input required placeholder="Ім'я" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12 rounded-2xl bg-zinc-50 px-4 font-semibold outline-none ring-1 ring-zinc-100 focus:ring-pink-300" />
                    <input required placeholder="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-12 rounded-2xl bg-zinc-50 px-4 font-semibold outline-none ring-1 ring-zinc-100 focus:ring-pink-300" />
                    <input placeholder="Місто" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-12 rounded-2xl bg-zinc-50 px-4 font-semibold outline-none ring-1 ring-zinc-100 focus:ring-pink-300" />
                    <input placeholder="Відділення / поштомат" value={form.delivery} onChange={(e) => setForm({ ...form, delivery: e.target.value })} className="h-12 rounded-2xl bg-zinc-50 px-4 font-semibold outline-none ring-1 ring-zinc-100 focus:ring-pink-300" />
                    <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="h-12 rounded-2xl bg-zinc-50 px-4 font-semibold outline-none ring-1 ring-zinc-100 focus:ring-pink-300">
                      {selectedProduct.sizes.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <div className="flex h-12 items-center justify-between rounded-2xl bg-zinc-50 px-3 ring-1 ring-zinc-100">
                      <button type="button" onClick={() => setForm({ ...form, qty: Math.max(1, Number(form.qty) - 1) })}><Minus className="h-4 w-4" /></button>
                      <span className="font-black">{form.qty}</span>
                      <button type="button" onClick={() => setForm({ ...form, qty: Number(form.qty) + 1 })}><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <textarea placeholder="Коментар" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} className="mt-3 h-24 w-full rounded-2xl bg-zinc-50 p-4 font-semibold outline-none ring-1 ring-zinc-100 focus:ring-pink-300" />
                  <Button type="submit" className="mt-4 h-14 w-full rounded-2xl bg-pink-600 text-base font-black hover:bg-pink-700"><Send className="mr-2 h-5 w-5" /> Підтвердити замовлення</Button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCrm && (
          <motion.div className="fixed inset-0 z-[70] bg-zinc-950/50 p-3 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }} className="ml-auto h-full w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl md:p-8">
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="flex items-center gap-2 font-black text-pink-600"><Filter className="h-4 w-4" /> CRM-панель</p>
                  <h2 className="text-3xl font-black">Управління замовленнями</h2>
                </div>
                <div className="flex gap-2">
                  <Button onClick={exportOrders} variant="outline" className="rounded-2xl font-black"><Download className="mr-2 h-4 w-4" /> Excel/CSV</Button>
                  <Button onClick={() => setShowCrm(false)} className="rounded-2xl bg-zinc-950 font-black hover:bg-pink-600"><X className="mr-2 h-4 w-4" /> Закрити</Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                {statuses.map((status) => {
                  const count = orders.filter((o) => o.status === status).length;
                  return <div key={status} className="rounded-3xl bg-zinc-50 p-5 ring-1 ring-zinc-100"><p className="text-sm font-bold text-zinc-500">{status}</p><p className="mt-1 text-3xl font-black">{count}</p></div>;
                })}
              </div>

              <div className="mt-6 rounded-[2rem] bg-zinc-50 p-5 ring-1 ring-zinc-100">
                <h3 className="mb-4 text-2xl font-black">Додати товар</h3>
                <form onSubmit={addProduct} className="grid gap-3 md:grid-cols-4">
                  <input required placeholder="Назва товару" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="h-12 rounded-2xl bg-white px-4 font-semibold outline-none ring-1 ring-zinc-100" />
                  <select value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} className="h-12 rounded-2xl bg-white px-4 font-semibold outline-none ring-1 ring-zinc-100">
                    {categories.filter((c) => c !== "Всі").map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <input required type="number" placeholder="Ціна" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} className="h-12 rounded-2xl bg-white px-4 font-semibold outline-none ring-1 ring-zinc-100" />
                  <input type="number" placeholder="Стара ціна" value={newProduct.oldPrice} onChange={(e) => setNewProduct({ ...newProduct, oldPrice: e.target.value })} className="h-12 rounded-2xl bg-white px-4 font-semibold outline-none ring-1 ring-zinc-100" />
                  <input placeholder="Розміри через кому: S,M,L" value={newProduct.sizes} onChange={(e) => setNewProduct({ ...newProduct, sizes: e.target.value })} className="h-12 rounded-2xl bg-white px-4 font-semibold outline-none ring-1 ring-zinc-100" />
                  <input placeholder="Кольори через кому" value={newProduct.colors} onChange={(e) => setNewProduct({ ...newProduct, colors: e.target.value })} className="h-12 rounded-2xl bg-white px-4 font-semibold outline-none ring-1 ring-zinc-100" />
                  <input placeholder="Мітка: Хіт / Акція" value={newProduct.tag} onChange={(e) => setNewProduct({ ...newProduct, tag: e.target.value })} className="h-12 rounded-2xl bg-white px-4 font-semibold outline-none ring-1 ring-zinc-100" />
                  <input placeholder="Або посилання на фото" value={newProduct.image} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} className="h-12 rounded-2xl bg-white px-4 font-semibold outline-none ring-1 ring-zinc-100" />
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="h-12 rounded-2xl bg-white px-4 py-3 font-semibold outline-none ring-1 ring-zinc-100 md:col-span-2" />
                  <Button disabled={uploading} type="submit" className="h-12 rounded-2xl bg-pink-600 font-black hover:bg-pink-700 md:col-span-2">{uploading ? "Завантажую..." : "Додати товар на сайт"}</Button>
                </form>
                {newProduct.image && <img src={newProduct.image} alt="preview" className="mt-4 h-36 w-36 rounded-2xl object-cover ring-1 ring-zinc-200" />}
                {imageFile && <p className="mt-3 text-sm font-bold text-zinc-600">Обране фото: {imageFile.name}</p>}
              </div>

              <div className="mt-6 rounded-[2rem] bg-white p-5 ring-1 ring-zinc-100">
                <h3 className="mb-4 text-2xl font-black">Товари на сайті</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-100">
                      <img src={p.image} alt={p.name} className="h-16 w-16 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black">{p.name}</p>
                        <p className="text-sm font-bold text-pink-600">{money(p.price)}</p>
                      </div>
                      <button onClick={() => deleteProduct(p)} className="grid h-10 w-10 place-items-center rounded-xl bg-white text-zinc-500 hover:bg-pink-50 hover:text-pink-600"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[2rem] ring-1 ring-zinc-100">
                <div className="hidden grid-cols-[90px_1fr_150px_120px_150px_180px] bg-zinc-950 px-4 py-3 text-sm font-black text-white md:grid">
                  <span>ID</span><span>Клієнт</span><span>Телефон</span><span>Сума</span><span>Місто</span><span>Статус</span>
                </div>
                <div className="divide-y divide-zinc-100">
                  {orders.map((order) => (
                    <div key={order.id} className="grid gap-3 p-4 md:grid-cols-[90px_1fr_150px_120px_150px_180px] md:items-center">
                      <span className="text-sm font-black text-zinc-400">#{order.id}</span>
                      <div>
                        <p className="font-black">{order.name}</p>
                        <p className="text-sm font-semibold text-zinc-500">{order.product} • {order.size} • {order.qty} шт.</p>
                      </div>
                      <span className="font-bold">{order.phone}</span>
                      <span className="font-black text-pink-600">{money(order.total)}</span>
                      <span className="font-semibold text-zinc-600">{order.city || "—"}</span>
                      <select value={order.status} onChange={(e) => changeStatus(order, e.target.value)} className="h-11 rounded-2xl bg-zinc-50 px-3 font-black outline-none ring-1 ring-zinc-100">
                        {statuses.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-[2rem] bg-pink-50 p-5 ring-1 ring-pink-100">
                <p className="flex items-center gap-2 font-black text-pink-700"><CheckCircle2 className="h-5 w-5" /> Firebase підключено в коді</p>
                <p className="mt-2 text-sm font-medium text-pink-900/70">Товари зберігаються в Firestore, фото — у Firebase Storage, замовлення — в колекції orders. Залишилось вставити свій firebaseConfig і правила доступу.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
