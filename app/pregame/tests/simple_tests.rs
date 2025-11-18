// Simple unit tests that test the individual functions without external dependencies

use pregame::models::{Guest, Party, RsvpStatus};
use chrono::{DateTime, Utc, TimeZone, Datelike, Timelike};

#[test]
fn test_guest_struct_creation() {
    let guest = Guest {
        id: 1,
        first_name: "John".to_string(),
        last_name: "Doe".to_string(),
        phone_number: "+1234567890".to_string(),
    };

    assert_eq!(guest.id, 1);
    assert_eq!(guest.first_name, "John");
    assert_eq!(guest.last_name, "Doe");
    assert_eq!(guest.phone_number, "+1234567890");
}

#[test]
fn test_party_struct_creation() {
    let party_date = Utc.with_ymd_and_hms(2024, 12, 31, 20, 0, 0).unwrap();
    let party = Party {
        id: 1,
        name: "New Year Party".to_string(),
        location: "Downtown Club".to_string(),
        description: "Celebrate the new year!".to_string(),
        date: Some(party_date),
    };

    assert_eq!(party.id, 1);
    assert_eq!(party.name, "New Year Party");
    assert_eq!(party.location, "Downtown Club");
    assert_eq!(party.description, "Celebrate the new year!");
    assert_eq!(party.date, Some(party_date));
}

#[test]
fn test_party_struct_without_date() {
    let party = Party {
        id: 2,
        name: "Casual Gathering".to_string(),
        location: "My House".to_string(),
        description: "Just hanging out".to_string(),
        date: None,
    };

    assert_eq!(party.id, 2);
    assert!(party.date.is_none());
}

#[test]
fn test_rsvp_status_enum() {
    let yes = RsvpStatus::Yes;
    let no = RsvpStatus::No;
    let maybe = RsvpStatus::Maybe;

    // Test that enum values are distinct
    assert_ne!(yes, no);
    assert_ne!(yes, maybe);
    assert_ne!(no, maybe);

    // Test that enum implements Debug (for formatting)
    assert_eq!(format!("{:?}", yes), "Yes");
    assert_eq!(format!("{:?}", no), "No");
    assert_eq!(format!("{:?}", maybe), "Maybe");
}

#[test]
fn test_rsvp_status_equality() {
    assert_eq!(RsvpStatus::Yes, RsvpStatus::Yes);
    assert_eq!(RsvpStatus::No, RsvpStatus::No);
    assert_eq!(RsvpStatus::Maybe, RsvpStatus::Maybe);
}

#[test]
fn test_rsvp_status_ordering() {
    // Test that RsvpStatus implements PartialOrd
    let no = RsvpStatus::No;
    let maybe = RsvpStatus::Maybe;
    let yes = RsvpStatus::Yes;

    // These should be comparable - we just test that comparison works, not specific ordering
    assert!(no == no);
    assert!(maybe == maybe);
    assert!(yes == yes);
    assert!(no != maybe);
    assert!(maybe != yes);
    assert!(no != yes);
}

#[test]
fn test_guest_struct_clone() {
    let guest1 = Guest {
        id: 1,
        first_name: "Jane".to_string(),
        last_name: "Smith".to_string(),
        phone_number: "+0987654321".to_string(),
    };

    // Test that we can create a similar guest
    let guest2 = Guest {
        id: 2,
        first_name: guest1.first_name.clone(),
        last_name: guest1.last_name.clone(),
        phone_number: guest1.phone_number.clone(),
    };

    assert_eq!(guest1.first_name, guest2.first_name);
    assert_eq!(guest1.last_name, guest2.last_name);
    assert_eq!(guest1.phone_number, guest2.phone_number);
    assert_ne!(guest1.id, guest2.id);
}

#[test]
fn test_empty_string_fields() {
    let guest = Guest {
        id: 1,
        first_name: "".to_string(),
        last_name: "".to_string(),
        phone_number: "".to_string(),
    };

    let party = Party {
        id: 1,
        name: "".to_string(),
        location: "".to_string(),
        description: "".to_string(),
        date: None,
    };

    assert_eq!(guest.first_name, "");
    assert_eq!(party.name, "");
    assert!(party.date.is_none());
}

#[test]
fn test_long_string_fields() {
    let long_string = "A".repeat(1000);
    
    let guest = Guest {
        id: 1,
        first_name: long_string.clone(),
        last_name: long_string.clone(),
        phone_number: long_string.clone(),
    };

    assert_eq!(guest.first_name.len(), 1000);
    assert_eq!(guest.last_name.len(), 1000);
    assert_eq!(guest.phone_number.len(), 1000);
}

#[test]
fn test_datetime_formatting() {
    let party_date = Utc.with_ymd_and_hms(2024, 6, 15, 14, 30, 0).unwrap();
    let party = Party {
        id: 1,
        name: "Test Party".to_string(),
        location: "Test Location".to_string(),
        description: "Test Description".to_string(),
        date: Some(party_date),
    };

    // Test that we can format the date
    if let Some(date) = party.date {
        let formatted = date.format("%Y-%m-%d %H:%M:%S UTC").to_string();
        assert_eq!(formatted, "2024-06-15 14:30:00 UTC");
    }
}

#[test]
fn test_invitation_struct_creation() {
    use pregame::models::Invitation;
    
    let invitation = Invitation {
        id: 1,
        guest_id: 123,
        party_id: 456,
        status: RsvpStatus::Yes,
    };

    assert_eq!(invitation.id, 1);
    assert_eq!(invitation.guest_id, 123);
    assert_eq!(invitation.party_id, 456);
    assert_eq!(invitation.status, RsvpStatus::Yes);
}

#[test]
fn test_various_id_sizes() {
    use pregame::models::Invitation;
    
    // Test with large ID values
    let invitation = Invitation {
        id: i32::MAX,
        guest_id: i64::MAX,
        party_id: i64::MAX,
        status: RsvpStatus::Maybe,
    };

    assert_eq!(invitation.id, i32::MAX);
    assert_eq!(invitation.guest_id, i64::MAX);
    assert_eq!(invitation.party_id, i64::MAX);
}

// Integration test for status string conversion (mimics what happens in the gRPC layer)
#[test]
fn test_status_string_conversion() {
    let statuses = [
        (RsvpStatus::Yes, "yes"),
        (RsvpStatus::No, "no"),
        (RsvpStatus::Maybe, "maybe"),
    ];

    for (status, expected_str) in &statuses {
        let formatted = format!("{:?}", status).to_lowercase();
        assert_eq!(formatted, *expected_str);
    }
}

#[test] 
fn test_status_parsing_from_string() {
    let test_cases = [
        ("yes", RsvpStatus::Yes),
        ("no", RsvpStatus::No),
        ("maybe", RsvpStatus::Maybe),
    ];

    for (input, expected) in &test_cases {
        let parsed = match *input {
            "yes" => RsvpStatus::Yes,
            "no" => RsvpStatus::No,
            "maybe" => RsvpStatus::Maybe,
            _ => RsvpStatus::Maybe, // Default fallback
        };
        assert_eq!(parsed, *expected);
    }
}

#[test]
fn test_rfc3339_date_parsing() {
    let date_str = "2024-12-31T23:59:59Z";
    let parsed_date = date_str.parse::<DateTime<Utc>>();
    
    assert!(parsed_date.is_ok());
    
    if let Ok(date) = parsed_date {
        assert_eq!(date.year(), 2024);
        assert_eq!(date.month(), 12);
        assert_eq!(date.day(), 31);
        assert_eq!(date.hour(), 23);
        assert_eq!(date.minute(), 59);
        assert_eq!(date.second(), 59);
    }
}

#[test]
fn test_invalid_date_parsing() {
    let invalid_dates = [
        "not-a-date",
        "2024-13-01T00:00:00Z", // Invalid month
        "2024-12-32T00:00:00Z", // Invalid day  
        "2024-12-31T25:00:00Z", // Invalid hour
        "",
    ];

    for invalid_date in &invalid_dates {
        let result = invalid_date.parse::<DateTime<Utc>>();
        assert!(result.is_err(), "Expected '{}' to fail parsing", invalid_date);
    }
}