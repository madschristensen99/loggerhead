# Backend

This is basically divided in two parts, the defi folder which integrates privy and stargate and everything else which runs a multi-agent system using claude ai as the orchestrator that will query perplexity ai && chatgpt to know whether the exchange rate for Euro is better than the USD and vice versa.

## Express app

The objective of this Express app is to tell whether the exchange rate for euro is better than usd and vice versa according to recent news.

The app will spit out a json that looks like this:

```json
EUR: <string>
USD: <string>
reasoning: <string>
```

Sample output looks like this:

```json
{
  "EUR": "45%",
  "USD": "55%",
  "reasoning": "Based on the latest market analysis and economic data as of mid-2025, here is a detailed assessment and investment recommendation for EUR vs USD allocation:\n\n**Current Exchange Rates and Trends:**\n- EUR/USD is trading around 1.08, having gained about 5% over the past month, indicating recent euro strength against the dollar[2].\n- Bank of America forecasts only a modest rise in EUR/USD to about 1.05 by year-end 2025, signaling a stronger dollar bias overall[1].\n- JPMorgan, however, has turned tactically bullish on the euro, expecting EUR/USD to potentially reach 1.12-1.14 due to improved EU fiscal support and easing US exceptionalism[2].\n\n**Economic Indicators:**\n- Eurozone GDP growth is projected at 0.9% for 2025, with moderate recovery expected in subsequent years supported by fiscal stimulus and rising wages[3].\n- The US economy shows signs of moderation, which could weaken the dollar later in the year, according to JPMorgan[2].\n- Inflation and interest rate assumptions remain broadly stable, with ECB maintaining a cautious stance amid trade tensions and energy price volatility[3][4].\n\n**Central Bank Policies:**\n- The ECB is maintaining a cautious but supportive monetary policy, with recent decisions aimed at less restrictive financing conditions to support growth[3][4].\n- The Federal Reserve remains relatively hawkish, contributing to dollar strength, but market sentiment suggests this may moderate as US economic data softens[1][2].\n\n**Market Sentiment and Technical Analysis:**\n- Market sentiment is mixed: Bank of America leans towards a stronger dollar rally continuing into 2025, recommending hedges against dollar strength[1].\n- JPMorgan’s recent shift to bullish on EUR/USD reflects a tactical view that the euro could outperform in the medium term due to geopolitical and fiscal developments[2].\n- Technical indicators show recent euro momentum but with resistance near 1.12-1.14 levels.\n\n**Geopolitical Factors:**\n- A cease-fire and increased fiscal support in the EU have improved sentiment towards the euro[2].\n- US political developments and trade tensions continue to inject uncertainty, but no major shocks are currently expected[1][3].\n\n---\n\n### Investment Allocation Recommendation\n\n**Based on the above analysis, I recommend:**\n\n| Currency | Allocation (%) | Reasoning |\n|----------|----------------|-----------|\n| EUR      | 45%            | The euro shows tactical upside potential supported by EU fiscal stimulus, improving sentiment, and moderate GDP growth. The recent bullish shift by JPMorgan and easing US exceptionalism support this allocation. However, risks from trade tensions and ECB caution limit a higher allocation. |\n| USD      | 55%            | The US dollar remains fundamentally strong due to Fed policy and historical dollar resilience. Bank of America’s forecast of continued dollar strength and the modest EUR/USD upside cap justify a slightly higher USD allocation as a defensive position. |\n\n**Summary:**  \nA slight overweight in USD (55%) balances the current dollar strength and Fed policy with the tactical euro upside (45%) driven by EU fiscal support and improving geopolitical conditions. This allocation provides a balanced exposure to both currencies, capturing potential euro gains while hedging against dollar resilience.\n\n**Final allocation: EUR 45% and USD 55%.**"
}
```

### Get started

```sh
cd backend/
npm install
export PERPLEXITY_API_KEY=<your-key>
export OPENAI_API_KEY=<your-key>
export ANTHROPIC_API_KEY=<your-key>
npm start
```
