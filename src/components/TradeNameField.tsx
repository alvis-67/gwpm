"use client";

import { useState } from "react";

export function TradeNameField({ options }: { options: string[] }) {
  const [choice, setChoice] = useState("");

  return (
    <div className="field">
      <label htmlFor="nameChoice">工種名稱（必填）</label>
      <select
        id="nameChoice"
        name="nameChoice"
        required
        value={choice}
        onChange={(event) => setChoice(event.target.value)}
      >
        <option value="" disabled>
          選擇工種
        </option>
        {options.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
        <option value="__new__">新增</option>
      </select>
      {choice === "__new__" && (
        <>
          <label htmlFor="customName">新工種名稱（必填）</label>
          <input
            id="customName"
            name="customName"
            required
            placeholder="輸入後會記住，下次出現在選單"
          />
        </>
      )}
    </div>
  );
}
