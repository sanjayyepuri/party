"use client";

import Image from 'next/image'
import { Inter } from 'next/font/google'
import { useState, useEffect } from 'react'

const intsser = Inter({ subsets: ['latin'] })

function Guest({ guest }) {
  return (
    <div className="max-w-sm aspect-square rounded overflow-hidden px-3 py-3  outline">
      <h1 className="text-3xl font-semibold font-serif">Definitely Not a Cocktail Party</h1>
      <div className="text-sm">
        <p>123 Washington Street</p>
        <p>Apt. 51D</p>
        <p>8:00 PM</p>
      </div>

      <h1 className="py-4 text-lg font-bold">{guest.name} <span className="text-xs align-middle bg-slate-400 rounded px-1 py-1">{guest.status}</span></h1>
    </div>
  )
}

export default function Home() {
  let [passcode, setPasscode] = useState("");
  let [authState, setAuthState] = useState("");
  let [guest, setGuest] = useState(null);
  let [token, setToken] = useState(null);

  useEffect(() => {
    if (token) {
      const fetchGuest = async () => {
        let res = await fetch("/api/rsvp", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Party-Token": token,
          },
          credentials: "include",
        });
        let g = await res.json();
        setGuest(g);
      };
      fetchGuest().catch(console.error);
    }
  }, [token]);

  function onPasscodeChange(e) {
    setPasscode(e.target.value);
  }

  async function onSubmit() {
    setAuthState("pending")
    let res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ "passcode": passcode })
    });
    let token = await res.json();
    setToken(token.token);
    setAuthState("done");
  }

  return (
    <main className="container mx-auto px-4 py-4" >
      <div className="py-4">
        <h1 className="text-2xl">Hi</h1>
        <p>So I started to walk into the water. I won't lie to you boys, I was terrified. But I pressed on, and as I made my way past the breakers a strange calm came over me. I don't know if it was divine intervention or the kinship of all living things but I tell you Jerry at that moment, I wanted to throw a party.</p>
      </div>
      {!token && (
        <div className="py-4">
          <input placeholder="Enter passphrase" onChange={onPasscodeChange} className="rounded px-2 py-2 outline" value={passcode} />
          <button onClick={onSubmit} className="rounded ml-3 px-2 py-2 outline bg-blue-200 hover:bg-blue-300">Submit</button>
        </div>
      )}

      <div className="columns-2">
        {guest && <Guest guest={guest} />}
      </div>
    </main>
  )
}
