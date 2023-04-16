"use client";

import { useState, useEffect, useRef } from "react"
import { CSSTransition } from "react-transition-group"


function Guest({ guest, updateRsvp }) {

  function RsvpButton({ option, name }) {
    return (<button className={`p-2 hover:underline ${guest.status == option ? "italic" : ""}`} onClick={() => updateRsvp(option)}>{name}</button>)
  }

  return (
    <div>
      <CSSTransition
        classNames={{
          appear: "origin-top-left scale-0",
          appearActive: "origin-top-left transition duration-400 scale-100"
        }}
        appear={guest != null}
        in={guest != null}
        timeout={400}
      >
        <div>
          <div className="rounded-lg overflow-hidden px-3 py-3 border-4 border-bg">
            <h1 className="text-3xl font-semibold font-serif">Definitely Not a Cocktail Party</h1>
            <div className="text-sm">
              <p>8:00 PM</p>
              <p>123 Washington Street</p>
              <p>Apt. 51D</p>
            </div>

            <div className="flex py-4" >
              <h1 className="md:1/3 text-lg font-bold align-middle">{guest.name}</h1>
              <div className="md:2/3 w-full align-middle">
                <div className="w-fit float-right font-serif" role="group">
                  <RsvpButton option="Going" name="Going" />
                  <RsvpButton option="Maybe" name="Maybe" />
                  <RsvpButton option="Declined" name="Can't Go" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CSSTransition>

      <CSSTransition
        classNames={{
          appear: "transition opacity-0",
          appearActive: "transition duration-400 opacity-100"
        }}
        appear={guest != null}
        in={guest != null}
        timeout={1500}
      >
        <div className="my-4 float-right font-serif">
          <em>see you soon — sanjay</em>
        </div>
      </CSSTransition>
    </div>

  )
}

function PasscodeForm({ onSubmit }) {
  let [passcode, setPasscode] = useState("");

  function onPasscodeChange(e) {
    setPasscode(e.target.value);
  }

  function submit() {
    onSubmit(passcode);
  }

  return (
    <div>
      <div className="flex -m-2">
        <input className="md:w-4/5 m-2 p-2 dark:bg-black rounded-lg border-4 border-bg" placeholder="Enter passphrase" onChange={onPasscodeChange} value={passcode} />
        <button className="md:w-1/5 m-2 p-2 rounded-lg border-4 border-bg" onClick={submit} >Submit</button>
      </div>
    </div>
  );
}

export default function Home() {
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
        });
        let g = await res.json();
        setGuest(g);
      };
      fetchGuest().catch(console.error);
    }
  }, [token]);

  async function onSubmit(passcode: string) {
    let res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ "passcode": passcode })
    });
    let token = await res.json();
    setToken(token.token);
  }

  async function updateRsvp(rsvp: string) {
    let res = await fetch("/api/rsvp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Party-Token": token,
      },
      body: JSON.stringify({ "rsvp_status": rsvp })
    });

    let g = await res.json();
    setGuest(g);
  }

  return (
    <main className="container max-w-lg mx-auto px-4 py-4" >
      <div className="py-4">
        <p>So I started to walk into the water. I won't lie to you boys, I was terrified. But I pressed on, and as I made my way past the breakers a strange calm came over me. I don't know if it was divine intervention or the kinship of all living things but I tell you Jerry at that moment, I wanted to throw a party.</p>
      </div>

      {!token && <PasscodeForm onSubmit={onSubmit} />}

      {guest && <Guest guest={guest} updateRsvp={updateRsvp} />}
    </main>
  )
}
