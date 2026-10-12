import React, { useEffect, useState } from 'react';
import type { ClientRecord } from '../types';
import { api } from '../services/api';
import { Users, Search, Phone, Mail, MapPin, FileText, Check, Copy } from 'lucide-react';

interface ClientsViewProps {
  onSelectClient?: (client: ClientRecord) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = () => {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  useEffect(() => {
    api.getClients().then(data => {
      setClients(data);
      setLoading(false);
    });
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(text);
    setTimeout(() => setCopiedPhone(null), 1500);
  };

  const filteredClients = clients.filter(c =>
    c.fullName.toLowerCase().includes(filter.toLowerCase()) ||
    c.phone.includes(filter) ||
    (c.email && c.email.toLowerCase().includes(filter.toLowerCase())) ||
    (c.address && c.address.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto py-2">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" />
            Клієнтська база сервісного центру
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Реєстр контактних даних клієнтів, історія звернень та персональні нотатки менеджерів
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Пошук клієнта за ПІБ, телефоном..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#111827] border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">ПІБ Клієнта</th>
                <th className="py-3 px-4">Телефон</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Адреса</th>
                <th className="py-3 px-4">Нотатки менеджера</th>
                <th className="py-3 px-4 text-center">Замовлень</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Завантаження клієнтської бази...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Клієнтів не знайдено
                  </td>
                </tr>
              ) : (
                filteredClients.map(client => (
                  <tr key={client.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                          {client.fullName.charAt(0)}
                        </div>
                        <span>{client.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      <button
                        onClick={() => handleCopy(client.phone)}
                        className="inline-flex items-center gap-1.5 text-slate-300 hover:text-blue-400 transition-colors"
                        title="Скопіювати номер телефону"
                      >
                        <Phone className="h-3 w-3 text-slate-500" />
                        <span>{client.phone}</span>
                        {copiedPhone === client.phone ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3 text-slate-600 hover:text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {client.email ? (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[160px]">{client.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {client.address ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[180px]">{client.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {client.notes ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 text-amber-300/90 text-[11px] border border-amber-500/20">
                          <FileText className="h-3 w-3 shrink-0" />
                          <span>{client.notes}</span>
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-blue-400">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                        {client.ordersCount || 1}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
