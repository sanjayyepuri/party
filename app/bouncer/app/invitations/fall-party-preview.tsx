import { invitationCopy as copy } from "../parties/time-to-fall-2026/invitation-copy";
import { invitationName } from "../parties/time-to-fall-2026/invitation-content";
import type { Party } from "@/lib/types";
import { FallSpiral } from "../parties/time-to-fall-2026/fall-spiral";
import styles from "../parties/time-to-fall-2026/fall-invitation.module.css";

export function FallPartyPreview({ party }: { party: Party }) {
  return (
    <div className={styles.cardPreview}>
      <div className={styles.cardSpiral}>
        <FallSpiral className={styles.spiral} />
      </div>
      <div className={styles.cardCopy}>
        <span>{copy.preview.eyebrow}</span>
        <h3>
          {party.name === invitationName ? (
            <>
              {copy.title.firstLine}
              <br />
              <i>{copy.title.connector}</i> {copy.title.secondLine}
            </>
          ) : (
            party.name
          )}
        </h3>
        <time dateTime={party.time}>
          {new Intl.DateTimeFormat("en-US", {
            timeZone: copy.event.timeZone,
            month: "short",
            day: "numeric",
          }).format(new Date(party.time))}
        </time>
      </div>
    </div>
  );
}
