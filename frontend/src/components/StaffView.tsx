import React, { useEffect, useState } from 'react';
import type { StaffMember } from '../types';
import { api } from '../services/api';
import { Shield, UserCheck, Wrench, ShieldCheck, Key, Phone, CheckCircle2 } from 'lucide-react';

export const StaffView: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStaff().then(data => {
      setStaff(data);
      setLoading(false);
    });
  }, []);

  const getRoleInfo = (role: string) => {
    if (role === 'ROLE_ADMIN') {
      return {
        label: 'Адміністратор',
        badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        icon: ShieldCheck,
        description: 'Повний системний доступ: фінансова аналітика, видалення замовлень, керування складом із собівартістю та персоналом.'
      };
    }
    if (role === 'ROLE_MANAGER') {
      return {
        label: 'Менеджер',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        icon: UserCheck,
        description: 'Робота з клієнтами: повна клієнтська база, узгодження кошторисів, видача техніки та проведення оплат.'
      };
    }
    return {
      label: 'Прийомщик техніки',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      icon: Wrench,
      description: 'Робочий процес: первинний прийом техніки, діагностика, ремонт та наявність запчастин (без доступу до комерційних фінансів).'
    };
  };

  return (
    <div className="max-w-7xl mx-auto py-2">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Персонал та облікові записи CRM
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Контроль облікових записів співробітників сервісного центру та матриця прав доступу (RBAC)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            <h3 className="text-xs font-bold text-white">Адміністратор</h3>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Повний доступ до всієї системи: загальна каса, чистий прибуток, видалення замовлень, оприбуткування складу із собівартістю та керування персоналом.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white">Менеджер сервісу</h3>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Клієнтський менеджмент: доступ до всієї клієнтської бази, узгодження вартості з клієнтом, видача готових пристроїв, прийом оплат та роздрібні ціни.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white">Прийомщик техніки</h3>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Технічний цикл: оформлення прийому пристроїв, діагностика несправностей, взяття в роботу, списання запчастин зі складу (фінанси та закупівля сховані).
          </p>
        </div>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Співробітник</th>
                <th className="py-3 px-4">Логін (Username)</th>
                <th className="py-3 px-4">Посадова роль</th>
                <th className="py-3 px-4">Контактний телефон</th>
                <th className="py-3 px-4 text-center">Статус доступу</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    Завантаження списку персоналу...
                  </td>
                </tr>
              ) : (
                staff.map(member => {
                  const role = getRoleInfo(member.role);
                  const Icon = role.icon;
                  return (
                    <tr key={member.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200">
                            {member.fullName.charAt(0)}
                          </div>
                          <span>{member.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Key className="h-3 w-3 text-slate-500" />
                          <span>{member.username}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${role.badge}`}>
                          <Icon className="h-3.5 w-3.5" />
                          <span>{role.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-slate-500" />
                          <span>{member.phone || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Активний</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
