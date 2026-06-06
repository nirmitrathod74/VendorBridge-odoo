import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import { getRFQ } from "../services/rfqService";

export default function QuotationComparisonPage() {
  const { id } = useParams();
  const [rfq, setRfq] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getRFQ(id),
      api.get(`/rfqs/${id}/compare/`)
    ]).then(([rfqRes, quotesRes]) => {
      setRfq(rfqRes);
      setQuotes(quotesRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading comparison...</div>;
  if (!rfq) return <div className="p-8 text-center">RFQ not found.</div>;

  // Find lowest price
  const lowestPrice = quotes.length > 0 
    ? Math.min(...quotes.map(q => parseFloat(q.total)))
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/rfqs" className="text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h2 className="font-page-title text-page-title text-on-background m-0">Quotation Comparison</h2>
          <p className="font-body-main text-sm text-on-surface-variant mt-1">
            RFQ: {rfq.title} ({rfq.rfq_number}) — {quotes.length} quotations received
          </p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-[#E9ECEF] ambient-shadow overflow-x-auto p-card-padding">
        {quotes.length === 0 ? (
          <div className="text-center p-8 text-on-surface-variant">No submitted quotations to compare.</div>
        ) : (
          <div>
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr>
                  <th className="p-4 border-b border-[#E9ECEF] bg-[#F1F3F5] text-on-surface-variant font-semibold text-xs w-1/4">Criteria</th>
                  {quotes.map(q => (
                    <th key={q.id} className="p-4 border-b border-[#E9ECEF] bg-[#F1F3F5] text-on-surface font-bold text-sm text-center">
                      {q.vendor_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-body-main text-sm">
                <tr className="border-b border-[#E9ECEF]">
                  <td className="p-4 font-semibold text-on-surface-variant">Price</td>
                  {quotes.map(q => {
                    const isLowest = parseFloat(q.total) === lowestPrice;
                    return (
                      <td key={q.id} className={`p-4 text-center font-mono font-bold ${isLowest ? "bg-[#E6F4EA] text-[#137333]" : "text-on-surface"}`}>
                        ${parseFloat(q.price).toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-[#E9ECEF]">
                  <td className="p-4 font-semibold text-on-surface-variant">Tax</td>
                  {quotes.map(q => (
                    <td key={q.id} className="p-4 text-center text-on-surface-variant font-mono">
                      ${parseFloat(q.tax).toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[#E9ECEF]">
                  <td className="p-4 font-semibold text-on-surface-variant">Total</td>
                  {quotes.map(q => {
                    const isLowest = parseFloat(q.total) === lowestPrice;
                    return (
                      <td key={q.id} className={`p-4 text-center font-mono font-bold ${isLowest ? "bg-[#E6F4EA] text-[#137333]" : "text-on-surface"}`}>
                        ${parseFloat(q.total).toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-[#E9ECEF]">
                  <td className="p-4 font-semibold text-on-surface-variant">Delivery (Days)</td>
                  {quotes.map(q => (
                    <td key={q.id} className="p-4 text-center text-on-surface">
                      {q.delivery_days} days
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[#E9ECEF]">
                  <td className="p-4 font-semibold text-on-surface-variant">Warranty</td>
                  {quotes.map(q => (
                    <td key={q.id} className="p-4 text-center text-on-surface text-xs">
                      {q.warranty || "N/A"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4"></td>
                  {quotes.map(q => (
                    <td key={q.id} className="p-4 text-center">
                      <Link to={`/quotations`} className="bg-primary text-on-primary py-1.5 px-4 rounded-lg text-xs font-semibold hover:bg-[#5E3F57] transition-colors inline-block">
                        Select Proposal
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-[#137333] mt-4 font-semibold">Note: Green highlighting indicates the lowest price</p>
          </div>
        )}
      </div>
    </div>
  );
}
