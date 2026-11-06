import type { Party, RsvpWithUser } from "@/lib/types";
import { AddressLink } from "@/app/components/address-link";
import { RsvpForm } from "../[slug]/rsvp-form";
import { GuestList } from "../[slug]/guest-list";
import { createCalendarEvent } from "./calendar-event";
import { FallSpiral } from "./fall-spiral";
import styles from "./fall-invitation.module.css";
import { invitationCopy as copy } from "./invitation-copy";
import {
  invitationEvent,
  invitationName,
  invitationDateMarks,
} from "./invitation-content";

type FallInvitationProps =
  | { mode: "preview" }
  | {
      mode: "live";
      party: Party;
      partyRsvps: RsvpWithUser[] | null;
      partyRsvpsError: string | null;
      currentUserId: string;
    };
const easternDate = new Intl.DateTimeFormat("en-US", {
  timeZone: copy.event.timeZone,
  month: "long",
  day: "numeric",
  year: "numeric",
});
const easternTime = new Intl.DateTimeFormat("en-US", {
  timeZone: copy.event.timeZone,
  hour: "numeric",
  minute: "2-digit",
});

export function FallInvitation(props: FallInvitationProps) {
  const party = props.mode === "live" ? props.party : null;
  const details = party ?? invitationEvent;
  const time = details.time;
  const marks = invitationDateMarks(time);
  const date = new Date(time);
  const location = details.location;
  const hasLocation =
    location &&
    location !== "TBD" &&
    location !== copy.messages.locationPending;
  return (
    <div className={`fall-page ${styles.stage}`}>
      <article className={styles.invitation} aria-labelledby="fall-title">
        <div className={styles.poster}>
          <div className={styles.imprint}>
            <a
              href="/invitations"
              className={styles.backLink}
              aria-label={copy.navigation.backLabel}
            >
              {copy.navigation.back}
            </a>
            <span>{copy.poster.edition}</span>
          </div>
          <h1 id="fall-title" className={styles.title}>
            {party && party.name !== invitationName ? (
              party.name
            ) : (
              <>
                <span>{copy.title.firstLine}</span>
                <span className={styles.titleBottom}>
                  <i>{copy.title.connector}</i> {copy.title.secondLine}
                </span>
              </>
            )}
          </h1>
          <div className={styles.art}>
            <FallSpiral className={styles.spiral} />
          </div>
          <p className={styles.caption}>
            {copy.poster.caption}
            <br />
            <i>{copy.poster.italicCaption}</i>
          </p>
          <span className={styles.issue} aria-hidden="true">
            {marks.roman}
          </span>
        </div>
        <div className={styles.information}>
          <div className={styles.dateBlock}>
            <time dateTime={time}>
              <span className={styles.date}>{easternDate.format(date)}</span>
              <span className={styles.time}>
                {easternTime.format(date)} {copy.event.timeZoneLabel}
              </span>
            </time>
            {party && (
              <a
                className={styles.addCalendar}
                href={`data:text/calendar;charset=utf-8,${encodeURIComponent(createCalendarEvent(party))}`}
                download={`${party.slug}.ics`}
              >
                {copy.actions.addToCalendar}
              </a>
            )}
            <p className={styles.location}>
              {hasLocation ? (
                <AddressLink location={location} />
              ) : (
                copy.messages.locationPending
              )}
            </p>
          </div>
          {details.description && (
            <p
              className={styles.description}
              style={{ whiteSpace: "pre-wrap" }}
            >
              {details.description}
            </p>
          )}
        </div>
        {props.mode === "live" ? (
          <section className={styles.response} aria-labelledby="rsvp-heading">
            <div className={styles.responseHeading}>
              <h2 id="rsvp-heading">{copy.response.heading}</h2>
              <i>{copy.response.prompt}</i>
            </div>
            <div className={styles.responseContent}>
              <div className={styles.form}>
                <RsvpForm
                  partyId={props.party.party_id}
                  variant="monochrome"
                  copy={copy.rsvp}
                />
              </div>
              <div className={styles.guests}>
                {props.partyRsvpsError ? (
                  <p role="alert">
                    {copy.messages.guestListError} {props.partyRsvpsError}
                  </p>
                ) : props.partyRsvps ? (
                  <GuestList
                    rsvps={props.partyRsvps}
                    currentUserId={props.currentUserId}
                    variant="monochrome"
                    copy={copy.guests}
                  />
                ) : (
                  <p>{copy.messages.guestListLoading}</p>
                )}
              </div>
            </div>
          </section>
        ) : (
          <p className={styles.previewNote}>{copy.preview.message}</p>
        )}
        <footer className={styles.footer}>
          <a href="/invitations">{copy.navigation.back}</a>
          <span>{copy.footer}</span>
        </footer>
      </article>
    </div>
  );
}
