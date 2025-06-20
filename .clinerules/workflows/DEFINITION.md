# Side Hustle Bar PWA: Complete Project Understanding

**Author:** Manus AI  
**Date:** June 15, 2025  
**Version:** 1.0

## Executive Summary

The Side Hustle Bar PWA (Progressive Web Application) represents a comprehensive digital ecosystem designed to enhance the social experience at Side Hustle Bar locations through innovative geolocation-based features, real-time communication, and interactive entertainment systems. This document provides a complete understanding of the project's architecture, features, and workflows, with particular emphasis on the revolutionary "Wolf Pack" functionality that transforms how patrons interact with each other and the establishment.

The application leverages modern web technologies including Next.js for the frontend framework, Supabase for backend services and real-time database functionality, and Firebase Cloud Messaging (FCM) for push notifications. The system is designed with a mobile-first approach, ensuring optimal user experience across all devices while maintaining the capability to function as a native-like application through PWA technologies.

At its core, the Side Hustle Bar PWA creates a dynamic, location-aware social platform that activates when users are physically present at the bar locations. The Wolf Pack feature serves as the central hub for patron interaction, enabling real-time chat, food and beverage ordering, social interactions through "winks," and participation in DJ-hosted events and contests with voting capabilities.

## Technical Architecture Overview

The Side Hustle Bar PWA is built on a modern, scalable architecture that prioritizes real-time functionality, mobile responsiveness, and seamless user experience. The technical foundation consists of several key components working in harmony to deliver a comprehensive social and ordering platform.

The frontend application utilizes Next.js, a React-based framework that provides server-side rendering capabilities, automatic code splitting, and optimized performance for mobile devices. This choice ensures that the application loads quickly on mobile networks and provides a native app-like experience through Progressive Web App technologies. The mobile-first design philosophy permeates every aspect of the user interface, with responsive layouts that adapt seamlessly from smartphone screens to tablet and desktop displays.

Supabase serves as the primary backend infrastructure, providing PostgreSQL database services, real-time subscriptions, authentication, and API endpoints. The database schema, as evidenced by the comprehensive SQL structure, supports complex relationships between users, locations, wolf pack memberships, chat systems, ordering functionality, and event management. Supabase's real-time capabilities are particularly crucial for the chat functionality and live updates of wolf pack activities, ensuring that users receive immediate notifications of new messages, order status changes, and event announcements.

Firebase Cloud Messaging (FCM) handles push notification delivery across all supported platforms. The system stores device tokens in the Supabase database and utilizes Firebase's robust notification infrastructure to ensure reliable message delivery. This dual-platform approach leverages the strengths of both services: Supabase for data management and real-time features, and Firebase for proven notification reliability.

The geolocation system represents one of the most sophisticated aspects of the technical architecture. The application continuously monitors user location when permission is granted, comparing coordinates against predefined geofences around each bar location. The system is designed to be battery-efficient, implementing intelligent location checking that activates proximity detection only when users are in the general vicinity of bar locations, rather than constantly polling GPS coordinates.

For iOS devices, the application includes specific handling for PWA installation and notification permissions. iOS users receive detailed instructions for adding the application to their home screen, and the system implements the necessary user interaction triggers required by iOS to prompt for notification permissions. This ensures that iOS users can fully participate in the Wolf Pack experience despite the platform's more restrictive PWA policies.

The application architecture supports multiple bar locations, with location-specific features and staff assignments. Each location maintains its own Wolf Pack instance, chat rooms, and staff roster, while sharing the overall user base and menu systems. This multi-location approach allows for scalable expansion while maintaining the intimate, location-specific community feel that defines the Wolf Pack experience.

## Wolf Pack Feature: Core Functionality and Workflow

The Wolf Pack represents the heart and soul of the Side Hustle Bar PWA, transforming the traditional bar experience into an interactive, community-driven social platform. This feature creates a dynamic, location-based social network that activates only when users are physically present at one of the Side Hustle Bar locations, fostering genuine connections and enhancing the overall bar experience through technology.

### Geolocation-Based Activation System

The Wolf Pack activation system relies on sophisticated geolocation technology that continuously monitors user proximity to Side Hustle Bar locations. The system maintains geofence boundaries around each bar location, with a default radius that can be configured per location but typically extends to ensure coverage of the immediate bar area including outdoor seating and nearby parking areas.

When users approach a Side Hustle Bar location with the PWA installed and location permissions granted, the application begins proximity detection. The system is designed to be battery-efficient, implementing intelligent location checking algorithms that increase polling frequency as users get closer to bar locations. This approach ensures accurate detection while minimizing battery drain during normal daily activities.

The geolocation system supports multiple bar locations simultaneously, with each location maintaining its own geofence parameters stored in the locations table. The database schema includes latitude and longitude coordinates for each location, along with radius_miles settings that define the activation zone. The system also incorporates PostGIS spatial data types for more sophisticated geographic calculations, enabling features like distance-based notifications and location analytics.

Once a user enters the geofence of a bar location, the application triggers the Wolf Pack invitation process. However, activation is not automatic; users must be logged into the application to receive the invitation to join the Wolf Pack. This requirement ensures that all Wolf Pack members are authenticated users with established profiles, maintaining the quality and safety of the social environment.

For users who are not logged in when they enter a bar's geofence, the application presents a streamlined signup and login process. The system recognizes that users in this context are likely interested in immediate access to Wolf Pack features, so the authentication flow is optimized for speed and simplicity. New users can quickly create accounts using email authentication through Supabase, while returning users can log in using their existing credentials.

The Wolf Pack invitation appears as an engaging, visually appealing prompt that explains the benefits of joining the pack. The invitation emphasizes the social aspects of the feature, highlighting the ability to chat with other patrons, order food and drinks, participate in events, and connect with the bar's community. The invitation design follows the application's mobile-first philosophy, ensuring it displays attractively on all device sizes.

### Wolf Pack Membership Management

Once users accept the invitation to join the Wolf Pack, they become active members with access to the full range of social and ordering features. The wolf_pack_members table tracks all active memberships, storing essential information including the user's current location coordinates, table location if specified, and activity timestamps.

Wolf Pack membership is inherently temporary and location-specific. Members remain active in the pack as long as they stay within the geofence boundaries and maintain application activity. The system tracks last_activity timestamps to identify inactive members and automatically removes them from the pack after a period of inactivity. This ensures that the Wolf Pack roster accurately reflects users who are currently present and engaged at the bar.

The membership system supports multiple concurrent Wolf Packs across different locations. A user can theoretically be a member of multiple packs if they move between locations, though in practice, the system is designed around the assumption that users will be at one location at a time. Each Wolf Pack maintains its own member roster, chat rooms, and activity feeds, creating distinct communities for each bar location.

Members can specify their table location within the bar, which enhances the ordering experience and helps staff deliver food and drinks efficiently. The table_location field in the wolf_pack_members table stores this information as free-form text, allowing users to specify booth numbers, bar seats, patio tables, or other location descriptors that help staff identify their position within the establishment.

The system maintains comprehensive activity tracking for Wolf Pack members, recording join times, last activity, and duration of membership. This data serves multiple purposes: it helps maintain accurate member rosters, provides analytics for bar management, and enables features like "time spent at bar" statistics that can be incorporated into loyalty programs or social features.

### Daily Reset and Operating Hours

One of the most important aspects of the Wolf Pack system is its daily reset cycle, which ensures that each day brings a fresh start to the social experience. The Wolf Pack resets every night at 2:30 AM, automatically removing all members and clearing the slate for the next day's activities. This reset serves several important purposes: it prevents stale memberships from accumulating, ensures that the member roster always reflects current patrons, and creates a natural rhythm that aligns with bar operating patterns.

The Wolf Pack becomes available for new members starting at 11:00 AM each day, seven days a week. This schedule accommodates the bar's operating hours while ensuring that the social features are available during all business periods. The timing allows for lunch crowds, happy hour gatherings, dinner service, and late-night entertainment, covering the full spectrum of bar activities throughout the day.

The reset and activation schedule is managed through automated processes that run on the server infrastructure. The system includes safeguards to ensure that resets occur reliably even during high-traffic periods or system maintenance windows. Database triggers and scheduled jobs handle the membership cleanup, while application logic manages the activation timing for new member invitations.

During the reset process, all active wolf_pack_members records are archived or deleted, chat history is preserved but marked as from previous sessions, and any active events or contests are concluded. The reset is designed to be seamless from the user perspective, with clear communication about the daily refresh cycle so users understand why they need to rejoin the pack each day.

### Real-Time Chat System

The Wolf Pack chat system represents one of the most engaging features of the platform, enabling real-time communication between all active pack members at a given location. The chat functionality is built on Supabase's real-time capabilities, ensuring that messages appear instantly across all connected devices without requiring manual refresh or polling.

The wolf_chat table stores all chat messages with comprehensive metadata including timestamps, user identification, message content, and optional image attachments. The system supports both text and image messages, allowing users to share photos of their food, drinks, or experiences at the bar. Image uploads are handled through the integrated images table, with proper storage management and optimization for mobile viewing.

Chat messages are location-specific, meaning that users only see messages from other Wolf Pack members at the same bar location. This creates intimate conversation spaces that reflect the physical reality of being in the same establishment. The location_id association ensures that messages are properly filtered and delivered only to relevant pack members.

The chat system includes moderation features to maintain a positive environment. Users can flag inappropriate messages using the content_flags table, which triggers review by bar staff or administrators. The flagging system includes reason codes and timestamps, enabling efficient moderation workflows. Flagged content can be hidden from the chat while under review, and repeat offenders can be temporarily or permanently banned from Wolf Pack participation.

Message reactions add an additional layer of engagement to the chat experience. The wolf_reactions table enables users to respond to messages with emoji reactions, creating a more expressive communication environment. Reactions are displayed in real-time alongside messages, showing which users have reacted and with which emoji. This feature encourages participation from users who might be hesitant to post full messages but want to engage with the conversation.

The chat interface is designed for mobile-first usage, with large touch targets, easy scrolling, and optimized keyboard handling. The system automatically handles message threading and maintains conversation flow even as new members join or leave the pack. Message history is preserved throughout the day, allowing new pack members to see recent conversation context when they join.

### Food and Beverage Ordering Integration

The Wolf Pack ordering system revolutionizes the traditional bar service model by enabling pack members to place food and beverage orders directly through the application. This feature streamlines the ordering process, reduces wait times, and provides a more personalized service experience while maintaining the social atmosphere that defines the bar environment.

The ordering system is deeply integrated with the comprehensive menu management infrastructure, which includes food_drink_categories and food_drink_items tables that store the complete menu with pricing, descriptions, and availability status. Menu items are organized into categories with distinct visual themes and colors, ensuring that the ordering interface is both functional and visually appealing. The system supports real-time menu updates, allowing bar staff to mark items as unavailable or update pricing without requiring application updates.

When Wolf Pack members place orders, the system creates records in the bartender_orders table, which tracks the complete order lifecycle from initial placement through completion. Each order includes comprehensive information: the customer's identity, selected bartender if specified, location details, order items with customizations, total amount, and customer notes. The customer notes field is particularly important in the Wolf Pack context, as it allows users to specify their table location, request specific bartenders, or provide other service preferences.

The ordering system explicitly does not handle payment processing, maintaining the traditional bar model where customers pay at the register. This approach preserves the personal interaction between customers and staff while leveraging technology to improve the ordering and fulfillment process. Orders are marked as completed when delivered, but payment tracking occurs through the separate bartender_tabs system that staff manage independently.

Order customization is supported through the menu_item_modifiers and item_modifier_groups tables, which enable complex menu configurations. Customers can specify meat preferences, sauce selections, side dishes, and other modifications that are common in bar food service. The customization system is flexible enough to handle both required selections (such as meat choice for burritos) and optional additions (such as extra toppings or sides).

The table location feature within orders is particularly valuable in the Wolf Pack context. Since pack members can specify their seating location when joining the pack, this information automatically populates in their orders, helping staff deliver food and drinks efficiently. Users can also update their table location or provide specific delivery instructions in the order notes, ensuring that service remains smooth even in busy periods.

Bartender assignment represents another unique aspect of the ordering system. Wolf Pack members can request specific bartenders when placing orders, creating opportunities for personalized service and building relationships between customers and staff. The system tracks these preferences and can suggest favorite bartenders for repeat customers, enhancing the overall service experience.

### Social Interaction Features

Beyond chat and ordering, the Wolf Pack includes several social interaction features designed to facilitate connections between pack members and enhance the overall bar experience. These features create opportunities for playful interaction while respecting user privacy and maintaining appropriate boundaries.

The "wink" feature enables pack members to send friendly signals to other users, creating a low-pressure way to express interest or acknowledgment. Winks are tracked in the wolf_pack_interactions table, which records the sender, recipient, interaction type, and timestamp. The system supports multiple interaction types beyond winks, including waves and howls, each with its own social meaning and visual representation.

Winks and other interactions are designed to be lighthearted and fun rather than intrusive. Recipients receive notifications of incoming winks but are not required to respond, and the system does not reveal whether winks have been viewed or acknowledged. This approach maintains the playful nature of the feature while respecting user autonomy and preventing unwanted pressure.

The interaction system includes privacy controls that allow users to disable incoming winks or other interactions if they prefer to focus on other aspects of the Wolf Pack experience. These settings are managed through user preferences and can be adjusted at any time, ensuring that all pack members can customize their social experience to match their comfort level.

Private messaging extends the social features beyond the group chat, enabling one-on-one conversations between pack members. The wolf_private_messages table stores these conversations with full encryption and privacy protections. Private messages support both text and image content, allowing for more personal communication while maintaining the security and moderation standards of the platform.

The private messaging system includes read receipts and delivery confirmations, helping users understand when their messages have been received and viewed. However, these features can be disabled by users who prefer more privacy in their communications. The system also supports message flagging and reporting, ensuring that inappropriate private communications can be addressed by moderation staff.

Connection tracking through the wolf_connections table creates a record of interactions between pack members, building a social graph that can enhance future experiences. When users interact through winks, private messages, or extended chat conversations, the system records these connections and can use them to suggest relevant social opportunities or group activities.

The social features are designed to complement rather than replace in-person interaction. The goal is to break the ice and facilitate connections that lead to real-world conversations and friendships. The technology serves as a bridge to help people overcome the initial awkwardness of approaching strangers in a bar setting, ultimately enhancing the social atmosphere of the establishment.

## Role-Based Features and Permissions System

The Side Hustle Bar PWA implements a sophisticated role-based access control system that defines distinct user types with specific capabilities and permissions. This system ensures that different stakeholders can effectively use the platform while maintaining appropriate boundaries and security measures. The role system supports four primary user types: regular users (customers), bartenders, DJs, and administrators, each with carefully designed feature sets that align with their responsibilities and needs.

### User Role Hierarchy and Authentication

The foundation of the role system lies in the users table, which includes a role field that determines each user's access level and available features. The role assignment is permanent for staff members but can be modified by administrators as needed. The system includes comprehensive permission tracking through the permissions jsonb field, which allows for granular control over specific features and capabilities beyond the basic role assignments.

Regular users represent the majority of the platform's user base and have access to all Wolf Pack social features, ordering capabilities, and participation in events and contests. These users can join Wolf Packs when at bar locations, participate in chat conversations, send winks and private messages, place food and beverage orders, and vote in DJ-created events. Regular users cannot create events, moderate content, or access administrative features, maintaining clear boundaries between customer and staff capabilities.

The authentication system ensures that all users, regardless of role, must be logged in to access Wolf Pack features. This requirement maintains security and enables proper attribution of actions and communications. The system supports multiple authentication methods through Supabase, including email/password combinations and social login options, providing flexibility while maintaining security standards.

Location-based role activation represents a unique aspect of the system, particularly for staff members. When DJs and bartenders log into the application, they must specify their current location (Salem or Portland), which determines which Wolf Pack they can interact with and manage. This location association ensures that staff members only have access to features and data relevant to their current work location, preventing confusion and maintaining operational efficiency.

### Wolf Profile System for All Users

One of the most innovative aspects of the role system is the universal Wolf Profile feature, which provides all users, regardless of their primary role, with a social persona for bar interactions. The wolf_profiles table stores these social profiles separately from the official user accounts, creating a distinction between professional/administrative identity and social/party persona.

Wolf Profiles include several key attributes that define a user's social presence within the Wolf Pack community. The display_name field allows users to choose how they want to be known in social contexts, which may differ from their legal name stored in the main user profile. This flexibility enables users to express their personality and create memorable social identities within the bar community.

The profile includes social elements such as favorite_drink, which helps bartenders provide personalized service and creates conversation starters between pack members. The vibe_status field allows users to express their current mood or intentions for the evening, with default options like "Ready to party! 🎉" that can be customized to reflect individual personality and current state of mind.

Instagram integration through the instagram_handle field enables users to connect their social media presence with their Wolf Profile, facilitating connections that extend beyond the bar environment. The looking_for field allows users to indicate what type of social interaction they're seeking, whether it's casual conversation, dancing partners, or new friendships, helping to set appropriate expectations for social interactions.

The Wolf Profile system includes privacy controls through the is_visible field, allowing users to participate in Wolf Pack activities while controlling their social visibility. Users can disable their profile visibility while maintaining access to chat, ordering, and voting features, providing flexibility for different comfort levels and social preferences.

For staff members, Wolf Profiles serve a dual purpose: they enable staff to participate in the social aspects of the Wolf Pack community while maintaining their professional roles. A DJ can have a Wolf Profile that reflects their musical interests and personality while also having access to DJ-specific features like event creation and broadcast messaging. This dual identity system helps staff members connect with customers on a personal level while maintaining appropriate professional boundaries.

### Bartender Role and Capabilities

Bartenders represent a crucial role in the Side Hustle Bar PWA ecosystem, serving as the bridge between the digital ordering system and physical service delivery. The bartender role includes comprehensive order management capabilities, customer service tools, and integration with the traditional bar operations workflow.

The primary responsibility of bartenders within the system involves managing incoming orders from Wolf Pack members. The bartender_orders table tracks all orders with detailed status progression from pending through accepted, preparing, ready, delivered, and completed states. Bartenders can view incoming orders in real-time, accept orders they can fulfill, and update order status as they progress through preparation and delivery.

Order management includes the ability to add bartender notes to orders, which can include preparation instructions, substitution notifications, or delivery details. These notes help coordinate service delivery and provide communication channels between bartenders and customers without requiring direct interaction. The system also supports order modification and cancellation when necessary, with appropriate notifications sent to customers.

The bartender tab system, managed through the bartender_tabs table, enables bartenders to track customer spending and manage traditional bar tab functionality alongside the digital ordering system. Bartenders can create tabs for customers, add items from both digital orders and traditional counter service, and manage tab closure and payment processing. This integration ensures that the digital ordering system enhances rather than replaces traditional bar service models.

Bartenders have access to customer location information when available, helping them deliver orders efficiently within the bar space. The table_location information from Wolf Pack memberships and order notes provides context for service delivery, reducing confusion and improving customer satisfaction. The system also tracks delivery confirmation, ensuring that orders reach their intended recipients.

The role includes limited administrative capabilities related to order and customer management. Bartenders can flag problematic orders or customers, access customer order history for service context, and coordinate with other staff members through internal messaging systems. However, bartenders do not have access to broader administrative functions like user management or system configuration.

Bartender scheduling and location assignment ensure that the right staff members have access to relevant orders and customer information. When bartenders log in, they specify their current location, which determines which orders they can see and manage. This location-based filtering prevents confusion and ensures that orders are handled by staff members who are physically present to fulfill them.

### DJ Role and Event Management

The DJ role represents one of the most dynamic and engaging aspects of the Side Hustle Bar PWA, providing DJs with powerful tools to create interactive entertainment experiences that leverage the Wolf Pack community. DJs serve as entertainment coordinators and community facilitators, using the platform to enhance the musical and social atmosphere of the bar environment.

The core DJ capability involves broadcasting messages to all Wolf Pack members at their location through the dj_broadcasts table. These broadcasts can serve multiple purposes: general announcements about upcoming songs or events, requests for song suggestions from the crowd, contest announcements, or interactive entertainment prompts. The broadcast system ensures that all active pack members receive DJ communications in real-time, creating a direct channel between the DJ and the audience.

DJ event creation represents the most sophisticated aspect of the DJ role, enabling the creation of interactive contests and voting experiences that engage the entire Wolf Pack community. The dj_events table supports multiple event types, each designed to create unique entertainment experiences that leverage the social dynamics of the Wolf Pack platform.

The voting system for DJ events is designed to be simple, unique, and effective, supporting three primary voting formats that cover a wide range of entertainment scenarios. The first format involves simple "this or that" voting, where the DJ presents two options and pack members vote for their preference. This format works well for song selection ("Should we play rock or hip-hop next?"), activity choices ("Dance battle or karaoke contest?"), or general preference polling ("Lights up or lights down?").

The second voting format supports multiple choice questions with custom answers provided by the DJ. This format enables more complex polling and trivia-style interactions where the DJ can create questions with three, four, or more possible answers. Pack members select from the provided options, and results are tallied in real-time. This format works particularly well for trivia contests, preference surveys with multiple options, or decision-making scenarios that require more nuanced choices than simple binary voting.

The third voting format focuses on contest-style events where pack members vote for participants in competitions like "hottest guy of the night," "best dancer," or "most creative costume." For these events, the DJ first identifies willing participants from the Wolf Pack membership, adds them to the contest through the dj_event_participants table, and then opens voting where pack members select their favorite participant. This format creates engaging social competitions that highlight individual pack members while maintaining a fun, inclusive atmosphere.

The event management system includes comprehensive timing controls, allowing DJs to set voting periods, announce results, and manage event progression. Events can be scheduled in advance or created spontaneously based on crowd energy and participation levels. The system tracks voting participation and results, providing DJs with real-time feedback on event engagement and enabling them to adjust their entertainment strategy accordingly.

DJs have access to analytics and participation data that help them understand crowd preferences and optimize their entertainment approach. The system tracks which types of events generate the most participation, voting patterns, and engagement levels, enabling DJs to refine their interactive entertainment strategy over time.

The DJ role includes moderation capabilities for events and contests, allowing DJs to manage inappropriate participation, resolve disputes, and maintain the positive atmosphere that defines the Wolf Pack experience. DJs can remove participants from contests, cancel events if necessary, and coordinate with bar management when issues arise.

### Administrative Role and System Management

The administrative role provides comprehensive oversight and management capabilities for the entire Side Hustle Bar PWA ecosystem. Administrators have access to all system features and data, enabling them to manage users, moderate content, configure system settings, and maintain the overall health and security of the platform.

User management represents a core administrative responsibility, encompassing account creation, role assignment, permission management, and disciplinary actions. Administrators can create accounts for staff members, assign appropriate roles and permissions, and modify user access as needed. The system includes comprehensive user activity tracking through the admin_logs table, which records all administrative actions for accountability and audit purposes.

Content moderation capabilities enable administrators to review flagged content, manage inappropriate behavior, and maintain community standards. The content_flags table provides a centralized system for tracking reported issues, while administrators can review chat messages, private communications, and user profiles to ensure compliance with community guidelines. The moderation system includes escalation procedures and appeals processes to ensure fair treatment of all users.

System configuration and maintenance fall under administrative purview, including menu management, location settings, operational hours configuration, and feature toggles. Administrators can update food and drink menus, modify geofence boundaries for bar locations, adjust Wolf Pack operating hours, and enable or disable specific features as needed for operational requirements.

The push notification system is managed through administrative controls, enabling targeted communication with user segments or the entire user base. Administrators can create and schedule announcements, promotional messages, and system notifications, with comprehensive delivery tracking and analytics to measure communication effectiveness.

Analytics and reporting capabilities provide administrators with insights into system usage, user engagement, and operational metrics. The system tracks Wolf Pack participation rates, order volumes, event engagement, and other key performance indicators that help administrators understand platform effectiveness and identify areas for improvement.

Security management includes monitoring for suspicious activity, managing user authentication issues, and coordinating with technical support for system maintenance and updates. Administrators have access to security logs, error reports, and system health metrics that enable proactive management of platform stability and security.

The administrative role includes financial oversight capabilities related to order tracking and revenue analytics, though the system does not process payments directly. Administrators can generate reports on order volumes, popular menu items, and customer spending patterns that inform business decision-making and operational planning.


## Voting and Event System Architecture

The voting and event system represents the pinnacle of interactive entertainment within the Side Hustle Bar PWA, creating dynamic, real-time engagement opportunities that transform passive bar patrons into active participants in the evening's entertainment. This system leverages the Wolf Pack community structure to facilitate democratic decision-making, competitive contests, and social interactions that enhance the overall bar experience.

### Event Creation and Management Framework

The DJ-driven event creation system provides a flexible framework for generating various types of interactive experiences tailored to different crowd dynamics and entertainment goals. The dj_events table serves as the central repository for all event data, supporting multiple event types that can be customized based on the specific entertainment needs of each evening.

Event creation begins with the DJ assessing the current Wolf Pack composition and energy level, then selecting an appropriate event type that matches the crowd's mood and participation potential. The system supports both spontaneous event creation for immediate engagement and scheduled events that can build anticipation throughout the evening. Each event includes comprehensive metadata including title, description, timing parameters, and configuration options that define the specific mechanics of the voting or participation process.

The event lifecycle management system tracks events through multiple states: pending for events that are created but not yet active, active for events currently accepting participation or votes, voting for events in the voting phase, completed for finished events with determined outcomes, and cancelled for events that are terminated before completion. This state management ensures clear communication to Wolf Pack members about event status and availability.

Event timing controls provide DJs with precise management over participation and voting periods. Events can be configured with specific voting windows that automatically close after predetermined durations, or DJs can manually control event progression based on crowd engagement and participation levels. The system includes countdown timers and progress indicators that keep participants informed about remaining time for participation or voting.

### Three-Format Voting System Implementation

The voting system architecture supports three distinct formats that cover the full spectrum of interactive entertainment scenarios, each designed to be simple to understand, unique in its application, and effective in generating engagement from Wolf Pack members.

The binary choice format enables "this or that" voting scenarios where DJs present two options and Wolf Pack members select their preference. This format excels in situations requiring quick decisions or preference polling, such as music genre selection, activity choices, or simple preference surveys. The voting interface presents both options clearly with large, touch-friendly selection buttons optimized for mobile devices. Results are displayed in real-time with visual progress bars showing the current vote distribution, creating excitement as preferences shift throughout the voting period.

The multiple choice format expands voting options to support complex questions with three, four, or more possible answers. This format enables sophisticated polling scenarios, trivia contests, and decision-making processes that require nuanced choices beyond simple binary options. DJs can create custom answer sets tailored to specific questions or scenarios, with the system supporting up to eight answer choices to maintain interface clarity on mobile devices. The voting interface adapts dynamically to the number of options, ensuring optimal usability regardless of choice complexity.

The contest participant format focuses on competitive events where Wolf Pack members vote for their favorite participants in contests like "hottest guy of the night," "best dancer," or "most creative costume." This format requires a two-phase process: first, the DJ identifies willing participants from the Wolf Pack membership and adds them to the contest through the dj_event_participants table, then voting opens for all pack members to select their preferred participant. The participant selection process includes safeguards to ensure consent and appropriate participation, with participants able to withdraw from contests at any time.

### Real-Time Voting Mechanics and User Experience

The voting interface prioritizes simplicity and engagement, presenting voting options in visually appealing formats that encourage participation while maintaining clarity about the voting process. Each voting format includes real-time result updates that create excitement and engagement as votes are cast and tallied. The system prevents duplicate voting through user authentication and session tracking, ensuring that each Wolf Pack member can vote only once per event.

Vote casting is designed to be immediate and satisfying, with visual feedback confirming successful vote submission and real-time updates showing how the user's vote affects overall results. The interface includes progress indicators showing voting participation levels and remaining time for vote casting, creating urgency and encouraging prompt participation.

Results presentation varies based on event type and DJ preferences, with options for immediate result display during voting or delayed revelation after voting closes. For competitive events, results can be presented with dramatic flair, building suspense before announcing winners. The system supports both percentage-based results display and raw vote counts, depending on the event context and desired presentation style.

### Wolf Pack Visual Interface and Location Awareness

The Wolf Pack view represents one of the most innovative and engaging aspects of the entire platform, providing users with a dynamic, visual representation of the pack community and their spatial distribution within the bar environment. This interface transforms the abstract concept of Wolf Pack membership into a tangible, interactive experience that enhances social awareness and facilitates real-world connections through an intuitive spatial layout that mirrors the physical bar space.

The visual interface displays all active Wolf Pack members as star icons positioned according to their specified locations within the bar, creating a live map of the social environment. The design philosophy centers on simplicity and immediate comprehension, with clear visual distinctions between different types of users and their roles within the bar ecosystem. Staff members are prominently displayed with distinct visual indicators that separate them from regular pack members, ensuring that users can easily identify bartenders, DJs, and other staff when needed.

The DJ presence is represented through a prominent circular icon positioned in the designated DJ booth area, with clear labeling that identifies the current DJ by name. This positioning reflects the physical layout of the bar and helps pack members understand the entertainment focal point of the venue. The DJ icon includes directional indicators that emphasize their central role in creating and managing interactive events, making it clear that this is the source of entertainment announcements and voting opportunities.

Bartender representation utilizes rectangular name badges positioned in the bar service area, with house icons that clearly identify their service role within the establishment. Each bartender is individually labeled with their name, enabling pack members to identify specific staff members for personalized service requests or order preferences. The positioning of bartender icons reflects their physical location behind the bar, creating an intuitive understanding of where to find service and how to coordinate order delivery.

Wolf Pack members are represented as star icons scattered throughout the bar space according to their self-reported locations or GPS coordinates within the establishment. The star iconography reinforces the "wolf" theme while providing a clear, recognizable symbol that users can easily identify and interact with. Each star represents an active pack member who is currently present at the bar and participating in the Wolf Pack experience.

The interactive profile system enables users to click on any wolf star to access that member's Wolf Profile, creating immediate opportunities for social discovery and connection. This click-to-view functionality transforms the visual interface from a passive display into an active social exploration tool, encouraging users to learn about other pack members and identify potential conversation partners or social connections.

Location shout-outs enable pack members to broadcast their current position within the bar, creating opportunities for spontaneous meetups and social interactions. Users can announce when they're moving to different areas of the bar, invite others to join them at specific locations, or simply share their current vibe and availability for social interaction. These location announcements appear in the Wolf Pack view and can trigger notifications to nearby pack members who have opted into location-based alerts.

The visual representation includes customizable wolf avatars that reflect each user's Wolf Profile personalization choices. Users can select from various wolf emoji styles, colors, and accessories that represent their personality and current mood. These visual elements reset daily at 2:30 AM along with other temporary Wolf Pack features, encouraging users to express themselves differently each day while maintaining their core profile identity.

The spatial layout of the interface adapts to different bar configurations and can be customized for each location to reflect the unique physical characteristics of that establishment. The system supports multiple room layouts, outdoor seating areas, and special event spaces, ensuring that the visual representation accurately reflects the actual bar environment where pack members are located.

Real-time updates ensure that the Wolf Pack view remains current as members join, leave, or move within the bar space. The interface automatically refreshes member positions, updates staff availability, and reflects changes in pack composition without requiring manual refresh actions from users. This dynamic updating creates a living map of the social environment that accurately represents the current state of the Wolf Pack community.

The visual interface includes density indicators that help users understand crowd distribution within the bar, identifying popular gathering areas and quieter spaces for different types of social interaction. These indicators can help users choose appropriate locations for their desired social experience, whether they're seeking high-energy group interactions or more intimate conversation opportunities.

### Profile Customization and Daily Reset Mechanics

The Wolf Profile system balances persistent identity with daily refresh mechanics, creating a unique social environment that encourages both relationship building and fresh interactions. Users maintain core profile elements that persist across sessions while enjoying daily customization opportunities that reset with each Wolf Pack cycle.

Persistent profile elements include the user's display name, favorite drink preferences, Instagram handle, and basic biographical information that helps establish their social identity within the Wolf Pack community. Users can upload custom profile images that reflect their personality and style, with support for image optimization and mobile-friendly display formats. The profile description field allows complete creative freedom, enabling users to express their personality, interests, and social intentions in their own words.

Daily customization features include wolf emoji selections, vibe status updates, and location-specific preferences that reset at 2:30 AM with the Wolf Pack membership cycle. Users can choose from an extensive collection of wolf emojis that represent their current mood, energy level, or social availability. These emoji selections appear in the Wolf Pack view and help other members understand each user's current state and openness to interaction.

The daily reset mechanism serves multiple purposes: it prevents profile staleness, encourages regular engagement with customization features, creates natural conversation starters as users explore new emoji and status combinations, and maintains the dynamic, ever-changing nature of the Wolf Pack social environment. The reset timing at 2:30 AM aligns with bar closing procedures and ensures that each day begins with a fresh Wolf Pack experience.

Profile visibility controls allow users to manage their social presence within the Wolf Pack while maintaining access to all platform features. Users can adjust their visibility settings to control who can see their full profile, send them private messages, or include them in contest nominations. These privacy controls ensure that all users can participate comfortably in the Wolf Pack experience regardless of their social comfort level.

## Complete Wolf Pack Workflow: From Entry to Exit

The complete Wolf Pack workflow represents a carefully orchestrated user journey that begins when users approach a Side Hustle Bar location and continues through their entire visit, creating a seamless integration of digital features with the physical bar experience. Understanding this workflow is essential for comprehending how all system components work together to create the unique Wolf Pack experience.

### Site Access and Wolf Pack Joining Process

The Side Hustle Bar PWA operates on a tiered access model that distinguishes between general site browsing and active Wolf Pack participation. All users can access the website without authentication, enabling them to browse food and drink menus, view general bar information, check hours and location details, and explore the concept of the Wolf Pack experience. This open access approach ensures that potential customers can learn about the bar and its offerings without barriers while maintaining the exclusive nature of Wolf Pack membership.

The Wolf Pack joining process requires deliberate user action and authentication, creating a clear distinction between casual site visitors and active community participants. Users must be logged into their accounts and physically present at a bar location to access Wolf Pack features. This requirement ensures that all Wolf Pack members are verified users who are genuinely present at the establishment, maintaining the authentic social environment that defines the experience.

When authenticated users are within the geofence of a Side Hustle Bar location, they gain access to a "Join the Pack" option that initiates the Wolf Pack membership process. This is not an automatic invitation but rather an available action that users must actively choose to pursue. The join process includes location verification to confirm physical presence at the bar, preventing remote participation that could disrupt the genuine social dynamics of the Wolf Pack community.

The location verification process utilizes GPS coordinates to confirm that users are within the established geofence boundaries of the bar location. This verification step is essential for maintaining the integrity of the Wolf Pack experience, ensuring that all participants are physically present and able to engage in real-world social interactions that complement the digital features of the platform.

Once users click "Join the Pack" and complete location verification, they become active Wolf Pack members with immediate access to all social features, ordering capabilities, chat functionality, event participation, and interactive entertainment options. The joining process includes Wolf Profile setup or updates, enabling users to customize their social presence within the pack community.

### Authentication Requirements and Feature Access

The tiered access model creates clear boundaries between different levels of platform engagement. Unauthenticated users can explore the general website content, including menu browsing, location information, and Wolf Pack concept explanations, but cannot access any interactive features or place orders. This approach allows potential customers to evaluate the bar's offerings and understand the Wolf Pack experience before committing to account creation.

Authenticated users who are not physically present at a bar location can access their account settings, view their Wolf Profile, and browse extended menu information, but cannot join active Wolf Packs or place orders. This limitation ensures that the social and ordering features remain tied to physical presence at the establishment, maintaining the authentic bar experience that defines the platform.

Only authenticated users who are physically present at a bar location and have actively chosen to join the Wolf Pack gain access to the complete feature set including real-time chat, social interactions, food and beverage ordering, event participation, and all interactive entertainment options. This three-tier access model ensures appropriate feature availability while maintaining security and authenticity standards.

The ordering system specifically requires both authentication and active Wolf Pack membership, ensuring that all orders come from verified users who are present at the bar and can receive their food and drinks. This requirement prevents fraudulent orders and ensures efficient service delivery while maintaining the social context that enhances the ordering experience.

### Wolf Pack Membership Activation and Profile Setup

When users successfully join the Wolf Pack through the deliberate action of clicking "Join the Pack" and completing location verification, they enter the pack as active members with immediate access to all social and ordering features. The membership activation process creates a wolf_pack_members record that tracks their participation, location within the bar, and activity status throughout their visit.

New Wolf Pack members are prompted to complete or update their Wolf Profile, including display name selection, wolf emoji customization, vibe status setting, and location specification within the bar. The profile setup process is designed to be quick and engaging, with suggested options and popular choices that help users get started quickly while encouraging personalization.

The system automatically adds new members to the location-specific Wolf Pack roster stored in the wolf_pack_members table, recording join time, location coordinates, and initial activity status. This membership record enables all subsequent Wolf Pack features and ensures that users appear in the visual Wolf Pack interface for other members to see and interact with.

### Active Participation and Feature Engagement

Once in the Wolf Pack, users gain access to the complete feature set including real-time chat, social interactions, food and beverage ordering, and event participation. The chat system provides immediate connection to ongoing conversations with other pack members, with message history available to provide context for new joiners. Users can participate in group discussions, share images, and react to messages with emoji responses.

Social interaction features enable users to send winks to other pack members, initiate private conversations, and express interest in meeting or connecting. The interaction system is designed to be playful and low-pressure, encouraging social connections while respecting user privacy and autonomy. Users can adjust their interaction preferences and visibility settings at any time to control their social experience.

The ordering system allows pack members to browse the complete food and drink menu, customize orders with modifiers and special requests, specify delivery locations within the bar, and request specific bartenders for personalized service. Orders are transmitted directly to bar staff through the bartender interface, streamlining the service process while maintaining the social atmosphere of traditional bar service.

Event participation represents one of the most engaging aspects of Wolf Pack membership, with users receiving real-time notifications of DJ-created events and contests. Users can participate in voting events, join contests as participants, and engage with interactive entertainment that enhances the overall bar experience. The event system creates shared experiences that bring the Wolf Pack community together around common activities and competitions.

### Location Awareness and Social Discovery

The Wolf Pack visual interface provides continuous awareness of other pack members and their locations within the bar, creating opportunities for spontaneous social interactions and meetups. Users can see who else is in the pack, where they're positioned within the bar, and their current social availability through profile indicators and status updates.

Location shout-outs enable users to broadcast their movements within the bar, announce when they're changing locations, or invite others to join them at specific spots. These announcements appear in the Wolf Pack interface and can trigger location-based notifications for nearby members who have opted into proximity alerts.

The social discovery features help users identify potential connections based on shared interests, similar profiles, or complementary social intentions. The system can suggest conversation starters, highlight common interests, and facilitate introductions between pack members who might enjoy meeting each other.

### Event Participation and Voting Engagement

When DJs create events, all Wolf Pack members receive immediate notifications with event details and participation instructions. The event interface provides clear information about event type, voting options, participation requirements, and timing constraints. Users can join events as participants, cast votes in contests, or simply observe and enjoy the entertainment.

The voting interface adapts to the specific event format, presenting binary choices, multiple choice options, or participant selection interfaces as appropriate. Vote casting is immediate and satisfying, with real-time feedback showing how individual votes affect overall results. The system prevents duplicate voting while encouraging engagement through progress indicators and result previews.

Contest participation requires explicit consent, with users able to join contests as participants or decline participation while remaining engaged as voters. The system includes safeguards to ensure appropriate participation and provides mechanisms for participants to withdraw from contests if they become uncomfortable with the attention or competition.

### Daily Reset and Continuity Management

The Wolf Pack experience includes a daily reset cycle that occurs at 2:30 AM, automatically removing all active members and clearing temporary customization elements while preserving core user profiles and relationship data. This reset creates natural breakpoints in the social experience and ensures that each day begins with a fresh Wolf Pack community.

The reset process archives chat history, preserves user connections and interaction records, maintains core Wolf Profile data, and clears temporary elements like wolf emoji selections and daily status updates. Users who return to the bar on subsequent days can rejoin the Wolf Pack with their established profiles while enjoying fresh customization opportunities and new social dynamics.

The system communicates the reset schedule clearly to users, helping them understand the temporary nature of daily Wolf Pack membership while emphasizing the persistent elements of their social identity. This communication helps set appropriate expectations and encourages users to make the most of their current Wolf Pack session.

### Exit and Relationship Preservation

Users can leave the Wolf Pack voluntarily by exiting the application, moving outside the bar's geofence boundary, or explicitly leaving through the interface. The system tracks departure times and preserves relationship data for future visits, enabling continuity in social connections across multiple bar visits.

When users leave the Wolf Pack, their temporary customizations reset, their active membership status changes to inactive, and they stop receiving real-time notifications and updates. However, their core Wolf Profile remains intact, their connection history is preserved, and they can seamlessly rejoin the pack during future visits to the bar.

The exit process includes optional feedback collection to help improve the Wolf Pack experience, with users able to rate their session, provide suggestions, and indicate their likelihood of returning. This feedback helps bar management and system administrators understand user satisfaction and identify opportunities for enhancement.

The complete Wolf Pack workflow creates a comprehensive social and entertainment ecosystem that enhances the traditional bar experience through innovative technology integration. By understanding this workflow, stakeholders can appreciate how individual features combine to create a unique, engaging platform that brings people together and creates memorable social experiences within the Side Hustle Bar environment.


## Push Notification System and Cross-Platform Support

The push notification infrastructure represents a critical component of the Side Hustle Bar PWA, ensuring that users remain connected to Wolf Pack activities and receive timely updates about events, messages, and system announcements. The notification system leverages Firebase Cloud Messaging (FCM) for reliable cross-platform delivery while integrating seamlessly with the Supabase backend for user management and targeting.

### Device Token Management and Registration

The notification system begins with comprehensive device token management through the device_tokens table, which stores FCM tokens for all registered devices along with platform-specific metadata and status information. When users first install the PWA and grant notification permissions, the system registers their device with Firebase and stores the resulting token in the database with associations to their user account.

Device registration includes platform detection to handle iOS, Android, and web-specific notification behaviors and requirements. iOS devices require specific user interaction triggers to prompt for notification permissions, while Android and web platforms can request permissions more directly. The system adapts its permission request flow based on the detected platform, ensuring optimal user experience across all supported devices.

Token management includes automatic refresh handling for expired or invalid tokens, with the system monitoring delivery failures and updating token records as needed. The error tracking capabilities record failed delivery attempts, token refresh events, and platform-specific issues that help maintain high delivery reliability across the user base.

### Admin Dashboard Notification Controls

The administrative interface provides comprehensive notification management capabilities, enabling bar staff and administrators to create targeted communications for specific user segments or the entire user base. The announcements table stores all notification content with metadata including targeting criteria, delivery scheduling, and performance tracking.

Notification creation includes rich content support with titles, body text, images, and custom data payloads that can trigger specific application behaviors when users interact with notifications. The system supports both immediate delivery and scheduled notifications, allowing administrators to plan communications around events, promotions, or operational announcements.

Targeting capabilities enable precise audience selection based on user roles, location preferences, Wolf Pack membership status, and other demographic or behavioral criteria. Administrators can send notifications to all users, specific user segments, or individual users as needed for different communication scenarios.

### Real-Time Event and Chat Notifications

The notification system integrates deeply with Wolf Pack features to provide real-time alerts for chat messages, event announcements, voting opportunities, and social interactions. Users receive immediate notifications when they receive private messages, are mentioned in group chat, or when new events are created by DJs.

Event notifications include rich content that provides context about the event type, voting options, and participation requirements, enabling users to engage immediately without needing to navigate through multiple application screens. The notification content adapts based on event type, providing appropriate calls-to-action for voting events, contest participation, or general announcements.

Chat notifications respect user preferences and quiet hours settings, ensuring that users receive important communications while maintaining control over notification frequency and timing. The system includes intelligent batching for high-volume chat periods, preventing notification spam while ensuring users stay informed about relevant conversations.

## Menu Management and Ordering System Integration

The food and beverage ordering system represents a sophisticated integration between digital convenience and traditional bar service, enabling Wolf Pack members to browse menus, place orders, and coordinate with bar staff while maintaining the social atmosphere that defines the bar experience.

### Dynamic Menu System Architecture

The menu management system utilizes the food_drink_categories and food_drink_items tables to create a flexible, hierarchical menu structure that supports real-time updates and customization. Menu categories include visual theming with distinct colors and icons that create an engaging browsing experience while maintaining clear organization and navigation.

Menu items include comprehensive information including descriptions, pricing, availability status, and customization options through the modifier system. The item_modifier_groups and menu_item_modifiers tables enable complex customization scenarios including required selections, optional additions, and pricing adjustments that reflect the full range of bar food and beverage options.

Real-time availability management allows bar staff to mark items as unavailable when ingredients run out or preparation equipment is offline, ensuring that customers only see items that can actually be fulfilled. The availability system includes automatic restoration capabilities and staff notifications when popular items become unavailable.

### Order Lifecycle and Staff Coordination

The ordering workflow begins when Wolf Pack members browse the menu and create orders through the mobile interface, with orders stored in the bartender_orders table along with comprehensive metadata including customer preferences, delivery instructions, and timing requirements. The order system integrates with Wolf Pack location data to automatically populate delivery information based on the user's specified table or bar position.

Order status progression includes multiple stages from initial placement through staff acceptance, preparation, completion, and delivery confirmation. Each status change triggers notifications to customers, keeping them informed about order progress while enabling them to continue enjoying other Wolf Pack features without worrying about order timing.

Staff coordination features enable bartenders to view incoming orders, accept orders they can fulfill, add preparation notes, and coordinate delivery with other staff members. The system includes workload balancing capabilities that distribute orders among available staff and prevent any single bartender from becoming overwhelmed during busy periods.

### Payment Integration and Tab Management

While the ordering system does not process payments directly, it integrates with traditional bar tab management through the bartender_tabs system, enabling staff to track customer spending across both digital orders and traditional counter service. This integration maintains the familiar bar payment model while leveraging digital ordering for improved efficiency and customer experience.

Tab management includes customer identification, order aggregation, and total calculation features that help bartenders manage customer accounts and coordinate payment processing at the end of the evening. The system supports both individual orders and group tabs for parties that want to share expenses.

## Analytics and Performance Monitoring

The Side Hustle Bar PWA includes comprehensive analytics and monitoring capabilities that provide insights into user engagement, system performance, and business metrics that inform operational decisions and platform improvements.

### User Engagement Analytics

The wolfpack_analytics table captures detailed user behavior data including Wolf Pack participation rates, feature usage patterns, event engagement levels, and social interaction frequencies. This data helps bar management understand which features drive the most engagement and identify opportunities for enhancement or expansion.

Engagement metrics include session duration, feature adoption rates, repeat visit frequency, and social connection formation, providing a comprehensive view of how users interact with the platform and derive value from the Wolf Pack experience. The analytics system respects user privacy while providing actionable insights for business optimization.

### Operational Performance Metrics

System performance monitoring includes order fulfillment times, notification delivery rates, chat message volumes, and event participation levels that help identify operational bottlenecks and optimization opportunities. The monitoring system provides real-time dashboards for staff and administrators to track system health and user satisfaction.

Performance metrics inform capacity planning, staffing decisions, and feature prioritization, ensuring that the platform continues to provide excellent user experience as the user base grows and usage patterns evolve.

## Security and Privacy Framework

The Side Hustle Bar PWA implements comprehensive security and privacy protections that safeguard user data while enabling the social and interactive features that define the Wolf Pack experience.

### Data Protection and User Privacy

User data protection includes encryption for sensitive information, secure authentication through Supabase, and privacy controls that enable users to manage their information sharing and visibility preferences. The system implements data minimization principles, collecting only information necessary for platform functionality while providing transparency about data usage and retention.

Privacy controls include profile visibility settings, interaction preferences, location sharing options, and communication controls that enable users to customize their privacy level while participating in Wolf Pack activities. Users can adjust these settings at any time and receive clear information about how their choices affect their platform experience.

### Content Moderation and Safety

The content moderation system includes automated filtering, user reporting mechanisms, and staff review processes that maintain a positive, safe environment for all Wolf Pack participants. The content_flags table enables users to report inappropriate behavior, with escalation procedures that ensure prompt resolution of safety concerns.

Moderation tools include message filtering, user blocking capabilities, and administrative controls that enable staff to address problematic behavior quickly and effectively. The system includes appeals processes and graduated response procedures that ensure fair treatment while maintaining community standards.

## Conclusion and Implementation Readiness

The Side Hustle Bar PWA represents a comprehensive, innovative platform that transforms the traditional bar experience through sophisticated technology integration and community-focused features. The Wolf Pack functionality creates unique social opportunities that enhance patron engagement while supporting business objectives through improved customer satisfaction and operational efficiency.

The technical architecture leverages proven technologies including Next.js, Supabase, and Firebase to create a scalable, reliable platform that can support growing user bases and expanding feature sets. The mobile-first design ensures optimal user experience across all devices while the PWA capabilities provide native app-like functionality without requiring app store distribution.

The comprehensive feature set including geolocation-based activation, real-time chat, social interactions, food and beverage ordering, DJ-hosted events with voting, and administrative management tools creates a complete ecosystem that addresses all aspects of the bar social experience. The daily reset mechanism ensures fresh experiences while maintaining user identity and relationship continuity.

The role-based permission system enables appropriate access control for different user types while the Wolf Profile system creates engaging social identities that enhance community building and personal expression. The voting and event system provides dynamic entertainment opportunities that leverage crowd participation and democratic decision-making.

The push notification infrastructure ensures users remain connected to Wolf Pack activities while respecting privacy preferences and platform limitations. The analytics and monitoring capabilities provide insights for continuous improvement and business optimization.

The security and privacy framework protects user data while enabling the social features that define the platform, with comprehensive moderation tools that maintain community standards and user safety.

This comprehensive understanding document provides the complete picture of the Side Hustle Bar PWA architecture, features, and workflows necessary for successful Docker deployment and operational management. The platform is ready for implementation with all major components documented and understood, enabling confident deployment and ongoing development of this innovative social bar experience platform.

## Database Schema Summary

| Table Name | Primary Purpose | Key Features |
|------------|----------------|--------------|
| users | Core user management | Roles, authentication, location permissions |
| wolf_profiles | Social bar personas | Display names, emojis, vibe status, custom images |
| wolf_pack_members | Active pack membership | Location tracking, table positions, activity status |
| wolf_chat | Group messaging | Real-time chat, image support, moderation |
| wolf_private_messages | Direct messaging | Private conversations, read receipts |
| wolf_pack_interactions | Social actions | Winks, waves, howls between users |
| dj_events | Interactive entertainment | Voting events, contests, DJ-created activities |
| dj_event_participants | Contest participants | User participation in voting events |
| wolf_pack_votes | Democratic participation | Voting records for events and contests |
| bartender_orders | Digital ordering | Food/drink orders, status tracking, delivery |
| food_drink_items | Menu management | Items, pricing, availability, customization |
| device_tokens | Push notifications | FCM tokens, platform support, delivery tracking |
| locations | Geofencing | Bar locations, coordinates, activation zones |
| announcements | Admin communications | System-wide messaging, push notification content |

## Key Workflow Timings

| Process | Timing | Description |
|---------|--------|-------------|
| Wolf Pack Reset | 2:30 AM Daily | Complete membership reset, emoji clearing |
| Wolf Pack Activation | 11:00 AM Daily | New membership availability begins |
| Geofence Detection | Real-time | Continuous location monitoring for pack invitation |
| Chat Messages | Real-time | Instant delivery via Supabase subscriptions |
| Order Status Updates | Real-time | Immediate notification of order progression |
| Event Notifications | Real-time | Instant alerts for new DJ events and voting |
| Push Notifications | Real-time | FCM delivery for all notification types |

This comprehensive documentation provides complete understanding of the Side Hustle Bar PWA Wolf Pack system, ready for Docker deployment and operational implementation.
