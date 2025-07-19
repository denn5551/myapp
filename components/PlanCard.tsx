import React from 'react';

/** Plan information */
export interface Plan {
  id: string;
  title: string;
  price: string;
  features: string[];
  isActive: boolean;
}

/** Props for PlanCard */
interface PlanCardProps {
  plan: Plan;
  onSubscribe: (id: string) => void;
}

/**
 * Displays information about a subscription plan.
 */
export default function PlanCard({ plan, onSubscribe }: PlanCardProps) {
  const handleClick = () => {
    if (plan.isActive) {
      onSubscribe(plan.id);
    }
  };

  return (
    <div
      className={`border rounded p-6 flex flex-col gap-4 ${plan.isActive ? 'bg-white' : 'bg-gray-100 opacity-60'}`}
    >
      <h3 className="text-xl font-bold">{plan.title}</h3>
      <p className="text-lg font-semibold">{plan.price}</p>
      <ul className="list-disc pl-5 flex-1">
        {plan.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <button
        className="chat-send-button"
        disabled={!plan.isActive}
        onClick={handleClick}
      >
        {plan.isActive ? `Оплатить ${plan.price}` : 'Недоступно'}
      </button>
    </div>
  );
}
