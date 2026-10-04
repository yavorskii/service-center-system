import React, { useState } from 'react';
import { 
  Wrench, 
  Search, 
  Lock, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Laptop, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Phone, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Plus, 
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import type { Order, OrderStatus } from '../types';
import { api } from '../services/api';

interface ClientPortalProps {
  onOpenLogin: () => void;
  onOpenCreateModal: () => void;
}

const statusWorkflow: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'NEW', label: 'Прийом', desc: 'Зареєстровано в системі' },
  { key: 'IN_DIAGNOSTICS', label: 'Діагностика', desc: 'Визначення несправності' },
  { key: 'PENDING_APPROVAL', label: 'Узгодження', desc: 'Погодження кошторису' },
  { key: 'IN_PROGRESS', label: 'Ремонт', desc: 'Виконання робіт' },
  { key: 'READY_FOR_PICKUP', label: 'Готово', desc: 'Очікує видачі' },
  { key: 'COMPLETED', label: 'Видано', desc: 'Отримано клієнтом' },
];

export const ClientPortal: React.FC<ClientPortalProps> = ({
  onOpenLogin,
  onOpenCreateModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Order[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchAttempted(true);
    try {
      const results = await api.getOrdersByPhoneOrTracking(searchQuery.trim());
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getStepState = (stepKey: OrderStatus, currentStatus: OrderStatus) => {
    const orderIndex = statusWorkflow.findIndex(s => s.key === currentStatus);
    const stepIndex = statusWorkflow.findIndex(s => s.key === stepKey);
    if (currentStatus === 'CANCELED') return 'canceled';
    if (stepIndex < orderIndex) return 'completed';
    if (stepIndex === orderIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F8FAFC] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <header className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  RepairHub <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-medium">Сервіс</span>
                </span>
                <p className="text-[11px] text-slate-400 hidden sm:block">Авторизований сервісний центр техніки</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-6 text-xs font-medium text-slate-300">
              <button onClick={() => scrollToSection('hero')} className="hover:text-white transition-colors">
                Головна
              </button>
              <button onClick={() => scrollToSection('tracking')} className="hover:text-white transition-colors">
                Онлайн-трекінг
              </button>
              <button onClick={() => scrollToSection('services')} className="hover:text-white transition-colors">
                Послуги та ціни
              </button>
              <button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors">
                Про нас
              </button>
              <button onClick={() => scrollToSection('contacts')} className="hover:text-white transition-colors">
                Контакти
              </button>
            </nav>

            <div className="flex items-center gap-2.5">
              <button
                onClick={onOpenCreateModal}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Залишити заявку</span>
              </button>

              <button
                onClick={onOpenLogin}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all flex items-center gap-1.5"
                title="Вхід у внутрішню CRM-панель для адміністраторів та майстрів"
              >
                <Lock className="h-3.5 w-3.5 text-blue-400" />
                <span className="hidden sm:inline">Вхід для персоналу</span>
                <span className="sm:hidden">CRM</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <section id="hero" className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden border-b border-slate-800/60 bg-gradient-to-b from-[#0F172A]/40 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6 animate-in fade-in slide-in-from-top-3 duration-300">
            <ShieldCheck className="h-4 w-4" />
            <span>Офіційна гарантія до 6 місяців на всі види робіт</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
            Професійний ремонт техніки з <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">онлайн-відстеженням</span>
          </h1>

          <p className="mt-4 sm:mt-6 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Швидка діагностика за 30 хвилин, оригінальні комплектуючі та прозорі ціни. Перевірте статус вашого ремонту в реальному часі прямо зараз.
          </p>

          <div id="tracking" className="mt-8 max-w-2xl mx-auto bg-[#111827] p-2.5 sm:p-3 rounded-2xl border border-slate-800 shadow-2xl shadow-blue-900/10">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Введіть номер телефону або трек-код (напр. TRK-A8F91B)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#090D16] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95 disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                <span>{isSearching ? 'Пошук...' : 'Перевірити статус'}</span>
              </button>
            </form>
            <div className="flex items-center justify-between mt-2.5 px-2 text-[11px] text-slate-500">
              <span>Підказка: можна ввести код квитанції або номер телефону</span>
              <button
                type="button"
                onClick={() => setSearchQuery('TRK-A8F91B')}
                className="text-blue-400 hover:underline font-mono"
              >
                Спробувати: TRK-A8F91B
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto mt-12 text-left">
            <div className="p-3.5 rounded-xl bg-[#111827]/80 border border-slate-800">
              <Clock className="h-5 w-5 text-blue-400 mb-2" />
              <div className="text-sm font-bold text-white">Від 30 хвилин</div>
              <div className="text-xs text-slate-400">Експрес-діагностика дефектів</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#111827]/80 border border-slate-800">
              <ShieldCheck className="h-5 w-5 text-emerald-400 mb-2" />
              <div className="text-sm font-bold text-white">Гарантія 6 міс.</div>
              <div className="text-xs text-slate-400">Офіційний акт та чек</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#111827]/80 border border-slate-800">
              <Wrench className="h-5 w-5 text-amber-400 mb-2" />
              <div className="text-sm font-bold text-white">Оригінальні деталі</div>
              <div className="text-xs text-slate-400">Власний склад комплектуючих</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#111827]/80 border border-slate-800">
              <CheckCircle2 className="h-5 w-5 text-indigo-400 mb-2" />
              <div className="text-sm font-bold text-white">Live-трекінг</div>
              <div className="text-xs text-slate-400">Прозорий статус ремонту</div>
            </div>
          </div>
        </div>
      </section>

      {searchAttempted && (
        <section className="py-10 bg-[#0F172A]/50 border-b border-slate-800 animate-in fade-in duration-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Результати перевірки статусу</span>
                {searchResults && (
                  <span className="text-xs font-normal text-slate-400 font-mono">
                    (знайдено: {searchResults.length})
                  </span>
                )}
              </h2>
              <button
                onClick={() => { setSearchAttempted(false); setSearchResults(null); setSearchQuery(''); }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Очистити
              </button>
            </div>

            {searchResults && searchResults.length === 0 ? (
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-8 text-center">
                <AlertCircle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-white">Замовлення не знайдено</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Перевірте правильність введеного трек-коду або номера телефону. Якщо ви щойно здали пристрій, реєстрація триває до 5 хвилин.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults?.map(order => (
                  <div key={order.id} className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white font-mono">{order.orderNumber}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                            {order.device.brand} {order.device.model}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => handleCopy(order.trackingCode)}
                            className="text-xs text-slate-400 hover:text-blue-400 font-mono flex items-center gap-1 transition-colors"
                          >
                            <span>Код: {order.trackingCode}</span>
                            {copiedCode === order.trackingCode ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3 text-slate-500" />
                            )}
                          </button>
                          <span className="text-xs text-slate-500">• Прийнято: {order.createdAt}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-medium">До сплати</span>
                        <span className="text-lg font-bold text-white font-mono">{order.totalCost} ₴</span>
                      </div>
                    </div>

                    <div className="py-5">
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                        {statusWorkflow.map((step) => {
                          const state = getStepState(step.key, order.status);
                          return (
                            <div key={step.key} className="text-center">
                              <div className={`h-1.5 rounded-full mb-2 ${
                                state === 'completed'
                                  ? 'bg-emerald-500'
                                  : state === 'current'
                                  ? 'bg-blue-500 ring-2 ring-blue-500/30'
                                  : 'bg-slate-800'
                              }`} />
                              <div className={`text-xs font-semibold ${
                                state === 'current' ? 'text-blue-400' : state === 'completed' ? 'text-emerald-400' : 'text-slate-500'
                              }`}>
                                {step.label}
                              </div>
                              <div className="text-[10px] text-slate-500 hidden sm:block mt-0.5">
                                {step.desc}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-[#090D16] rounded-xl p-3.5 text-xs border border-slate-800/80">
                      <div className="font-semibold text-slate-300 mb-1">Заявлена несправність:</div>
                      <p className="text-slate-400 leading-relaxed">{order.defectDescription}</p>
                      {order.diagnosticsNotes && (
                        <div className="mt-2 pt-2 border-t border-slate-800 text-amber-300/90 text-xs">
                          <b>Висновок майстра:</b> {order.diagnosticsNotes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section id="services" className="py-16 md:py-20 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Послуги та орієнтовні ціни
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Проводимо ремонт будь-якої складності: від заміни розбитого скла до складної пайки ланцюгів живлення.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                  <Laptop className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Ремонт ноутбуків</h3>
                <ul className="text-xs text-slate-400 space-y-2 mb-6">
                  <li className="flex items-center justify-between">
                    <span>Чистка + термопаста</span>
                    <span className="font-semibold text-white font-mono">від 600 ₴</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Заміна матриці</span>
                    <span className="font-semibold text-white font-mono">від 800 ₴</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Ремонт після залиття</span>
                    <span className="font-semibold text-white font-mono">від 950 ₴</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Заміна клавіатури</span>
                    <span className="font-semibold text-white font-mono">від 450 ₴</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onOpenCreateModal}
                className="w-full py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Записатися на ремонт
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Ремонт смартфонів</h3>
                <ul className="text-xs text-slate-400 space-y-2 mb-6">
                  <li className="flex items-center justify-between">
                    <span>Заміна дисплея</span>
                    <span className="font-semibold text-white font-mono">від 750 ₴</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Заміна акумулятора</span>
                    <span className="font-semibold text-white font-mono">від 500 ₴</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Заміна роз'єму Type-C</span>
                    <span className="font-semibold text-white font-mono">від 450 ₴</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Ремонт динаміка / мікрофона</span>
                    <span className="font-semibold text-white font-mono">від 350 ₴</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onOpenCreateModal}
                className="w-full py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Записатися на ремонт
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                  <Tablet className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Ремонт планшетів</h3>
                <ul className="text-xs text-slate-400 space-y-2 mb-6">
                  <li className="flex items-center justify-between">
                    <span>Заміна сенсорного скла</span>
                    <span className="font-semibold text-white font-mono">від 850 ₴</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Заміна батареї iPad/Samsung</span>
                    <span className="font-semibold text-white font-mono">від 900 ₴</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Прошивка / скидання</span>
                    <span className="font-semibold text-white font-mono">від 400 ₴</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Відновлення плати</span>
                    <span className="font-semibold text-white font-mono">від 1100 ₴</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onOpenCreateModal}
                className="w-full py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Записатися на ремонт
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                  <Monitor className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">ПК та Монітори</h3>
                <ul className="text-xs text-slate-400 space-y-2 mb-6">
                  <li className="flex items-center justify-between">
                    <span>Діагностика материнської плати</span>
                    <span className="font-semibold text-white font-mono">від 400 ₴</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Ремонт блоку живлення</span>
                    <span className="font-semibold text-white font-mono">від 650 ₴</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Складання / апгрейд ПК</span>
                    <span className="font-semibold text-white font-mono">від 800 ₴</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Заміна LED підсвітки</span>
                    <span className="font-semibold text-white font-mono">від 700 ₴</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onOpenCreateModal}
                className="w-full py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Записатися на ремонт
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-16 md:py-20 border-b border-slate-800/80 bg-[#0F172A]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                Про сервісний центр
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Надійний партнер з ремонту цифрової техніки в Києві
              </h2>
              <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                RepairHub — це сучасна лабораторія з ремонту електроніки будь-якої складності. Ми оснащені високоточними інфрачервоними BGA-станціями, цифровими мікроскопами та програматорами.
              </p>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Кожен пристрій проходить обов'язковий вхідний та вихідний контроль якості. Усі замінені комплектуючі повертаються клієнту разом із гарантійним талоном.
              </p>

              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800">
                <div>
                  <div className="text-2xl font-bold text-white font-mono">8+</div>
                  <div className="text-xs text-slate-500 mt-1">Років на ринку</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white font-mono">14 200+</div>
                  <div className="text-xs text-slate-500 mt-1">Відремонтовано</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400 font-mono">98.6%</div>
                  <div className="text-xs text-slate-500 mt-1">Успішних робіт</div>
                </div>
              </div>
            </div>

            <div id="contacts" className="bg-[#111827] border border-slate-800 rounded-2xl p-6 sm:p-8">
              <h3 className="text-base font-bold text-white mb-4">Контактна інформація та графік</h3>
              
              <div className="space-y-4 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">Адреса сервісного центру:</span>
                    <span className="text-slate-400">м. Київ, вул. Хрещатик, 22 (біля ст. м. Майдан Незалежності)</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">Гаряча лінія приймання:</span>
                    <span className="text-slate-400 font-mono">+38 (044) 333-22-11 • +38 (067) 123-45-67</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">Графік роботи:</span>
                    <span className="text-slate-400">Пн–Пт: 09:00 – 20:00 • Сб–Нд: 10:00 – 18:00 (без перерви)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Потрібна швидка консультація?</span>
                <button
                  onClick={onOpenCreateModal}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span>Подати заявку</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-[#090D16] py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center">
              <Wrench className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-slate-300 font-semibold">RepairHub Service Center</span>
            <span>© 2026 Всі права захищено</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onOpenLogin} className="text-slate-400 hover:text-white flex items-center gap-1">
              <Lock className="h-3 w-3 text-blue-400" />
              <span>Панель співробітника</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
