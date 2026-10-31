import { config } from '../config.js';

/**
 * AI Complaint Classifier
 * Classifies a hostel resident's complaint into category, priority, department, and estimated SLA.
 */
export async function classifyComplaint(title = '', description = '') {
  const combinedText = `${title} ${description}`.trim();

  // 1. If Gemini API Key is provided, call Gemini API
  console.log('API Key present?', !!config.gemini.apiKey, 'Model:', config.gemini.model, 'Message:', message);
  if (config.gemini.apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an AI Triage Assistant for a university hostel facility management system.
Analyze the following student complaint and classify it.
Complaint Title: "${title}"
Complaint Description: "${description}"

Respond ONLY with valid JSON in this exact structure:
{
  "category": "Electrical" | "Plumbing" | "Cleaning" | "Internet" | "Furniture" | "Security" | "Other",
  "priority": "Low" | "Medium" | "High" | "Urgent",
  "department": "string",
  "estimatedSLA": "string",
  "reasoning": "string"
}`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        })
      });

      if (response.ok) {
      } else {
        console.error('Gemini NOT OK:', await response.text());
      }
      if (response.ok) {
      } else {
        const errData = await response.text();
        console.error('Gemini API Error:', errData);
      }
      if (response.ok) {
        const data = await response.json();
        console.log('Gemini full JSON:', JSON.stringify(data));
        console.log('Gemini Response:', JSON.stringify(data));
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawContent) {
          const parsed = JSON.parse(rawContent);
          return {
            ...parsed,
            source: 'gemini-ai'
          };
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to heuristic engine:', err.message);
    }
  }

  // 2. Built-in Smart Heuristic Classifier (Runs offline or without API key)
  return heuristicClassify(title, description);
}

function heuristicClassify(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  let category = 'Other';
  let priority = 'Medium';
  let department = 'General Maintenance';
  let estimatedSLA = '24-48 Hours';
  let reasoning = 'Standard maintenance triage based on complaint keywords.';

  // Keyword rules
  if (/fan|switch|light|bulb|short circuit|shock|socket|wiring|power|electricity|mcb|geyser|heater/i.test(text)) {
    category = 'Electrical';
    department = 'Electrical Maintenance';
    if (/shock|spark|smoke|fire|short circuit|burning/i.test(text)) {
      priority = 'Urgent';
      estimatedSLA = '1-2 Hours (Emergency Safety)';
      reasoning = 'Urgent safety hazard detected regarding electrical fault.';
    } else if (/no light|complete blackout|geyser/i.test(text)) {
      priority = 'High';
      estimatedSLA = '4-6 Hours';
      reasoning = 'Significant utility disruption affecting daily living.';
    } else {
      priority = 'Medium';
      estimatedSLA = '12-24 Hours';
      reasoning = 'Appliance or component repair scheduled for duty electrician.';
    }
  } else if (/leak|water|tap|pipe|flush|washroom|toilet|drain|sewage|clogged|sink|shower/i.test(text)) {
    category = 'Plumbing';
    department = 'Sanitary Maintenance';
    if (/overflowing|flooding|burst|sewage/i.test(text)) {
      priority = 'Urgent';
      estimatedSLA = '2 Hours';
      reasoning = 'Sanitation emergency due to flooding or major leakage.';
    } else if (/no water|dry tap/i.test(text)) {
      priority = 'High';
      estimatedSLA = '3-4 Hours';
      reasoning = 'Essential water supply interruption.';
    } else {
      priority = 'Low';
      estimatedSLA = '24 Hours';
      reasoning = 'Minor fixture leak or slow drainage.';
    }
  } else if (/wifi|wi-fi|internet|router|lan|network|ethernet|slow speed|packet loss|disconnection/i.test(text)) {
    category = 'Internet';
    department = 'IT & Network Operations';
    if (/entire floor|whole wing|exam|all rooms/i.test(text)) {
      priority = 'High';
      estimatedSLA = '4 Hours';
      reasoning = 'Network distribution or AP gateway outage impacting multiple residents.';
    } else {
      priority = 'Medium';
      estimatedSLA = '12 Hours';
      reasoning = 'Individual device or local AP connectivity troubleshooting.';
    }
  } else if (/bed|door|lock|window|cupboard|almirah|chair|table|desk|hinge|latch|glass/i.test(text)) {
    category = 'Furniture';
    department = 'Carpentry & Estate';
    if (/broken lock|cannot lock|door jammed|safety/i.test(text)) {
      priority = 'High';
      estimatedSLA = '3-6 Hours';
      reasoning = 'Room security compromised due to door/lock defect.';
    } else {
      priority = 'Low';
      estimatedSLA = '48 Hours';
      reasoning = 'Furniture fitting or cosmetic realignment.';
    }
  } else if (/dust|garbage|trash|cleaning|dirty|cockroach|insects|smell|sweep|mop/i.test(text)) {
    category = 'Cleaning';
    department = 'Housekeeping';
    priority = 'Medium';
    estimatedSLA = '6-12 Hours';
    reasoning = 'Housekeeping team dispatched on daily maintenance cycle.';
  } else if (/theft|unauthorized|stranger|fight|harassment|noise|loud|threat/i.test(text)) {
    category = 'Security';
    department = 'Chief Security Officer';
    priority = 'Urgent';
    estimatedSLA = 'Immediate (15-30 mins)';
    reasoning = 'Campus safety and security alert.';
  }

  return {
    category,
    priority,
    department,
    estimatedSLA,
    reasoning,
    source: 'rule-engine'
  };
}

/**
 * AI Grounded Hostel Assistant ("HostelGenie")
 * Answers student questions using grounded real-time database context.
 */
export async function chatWithHostelAssistant(message, context = {}) {
  const { student, room, complaints = [], todayMenu, notices = [] } = context;

  const groundedData = `
CURRENT SYSTEM DATABASE CONTEXT:
- Student Name: ${student?.name || 'Student'} (Roll: ${student?.roll_number || 'N/A'}, Branch: ${student?.branch || 'N/A'}, Year: ${student?.year || 'N/A'})
- Assigned Room: ${room ? `${room.room_number} (${room.room_type}, ${room.block_name || 'Block B'}, Floor ${room.floor}), Bed: ${room.bed_number}` : 'Not Allocated'}
- Roommate(s): ${room?.roommates ? room.roommates.map(r => `${r.name} (${r.phone})`).join(', ') : 'None'}
- Active Complaints: ${complaints.length > 0 ? complaints.map(c => `[ID #${c.id}]: "${c.title}" - Status: ${c.status} (${c.priority} priority, Dept: ${c.department})`).join('; ') : 'No pending complaints'}
- Today's Mess Menu (${todayMenu?.day_of_week || 'Today'}):
  * Breakfast: ${todayMenu?.breakfast || 'Standard items'}
  * Lunch: ${todayMenu?.lunch || 'Standard items'}
  * Snacks: ${todayMenu?.snacks || 'Standard items'}
  * Dinner: ${todayMenu?.dinner || 'Standard items'}
  * Special Item: ${todayMenu?.special_item || 'None'}
- Recent Official Notices:
${notices.slice(0, 3).map(n => `  * [${n.priority}] ${n.title}: ${n.description}`).join('\n')}
- Hostel Rules & Timings:
  * Main campus gate curfew: 09:30 PM (Biometric roll call: 9:30 PM - 10:15 PM)
  * Mess timings: Breakfast (07:30 - 09:00 AM), Lunch (12:30 - 02:00 PM), Snacks (05:00 - 06:00 PM), Dinner (07:30 - 09:30 PM)
  * Night Outing / Gate Pass: Submit online gate pass request before 5:00 PM for warden approval
  * Room change requests: Allowed between semesters or with genuine academic/medical reasons reviewed by Chief Warden
  * Emergency Contacts: Warden Office: +91 11 2766 8001 | Campus Ambulance: +91 11 2766 8999 | Security Control: Ext. 404
`;

  // 1. If Gemini API key is configured, call Gemini with grounded context
  if (config.gemini.apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are "HostelGenie", the smart, friendly, and helpful AI resident assistant for Apex Institute of Technology hostels.
Use the verified hostel database context below to answer the student's question accurately, concisely, and warmly.
Never invent facts that contradict the context.

${groundedData}

User Question: "${message}"`
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2000
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('Gemini raw text:', reply);
        if (reply) {
          return {
            reply,
            source: 'gemini-ai'
          };
        }
      }
    } catch (err) {
      console.warn('Gemini chat failed, falling back to local grounded assistant:', err.stack);
    }
  }

  // 2. Smart Grounded Local Fallback Engine
  const q = message.toLowerCase();

  if (/dinner|lunch|breakfast|food|menu|mess|eating|snacks/i.test(q)) {
    let mealInfo = '';
    if (/dinner/i.test(q)) mealInfo = `Tonight's Dinner features: **${todayMenu?.dinner || 'Paneer Butter Masala, Dal Tadka, Phulka Roti'}**${todayMenu?.special_item ? ` with special treat **${todayMenu.special_item}**` : ''}. Mess is open from 7:30 PM to 9:30 PM.`;
    else if (/lunch/i.test(q)) mealInfo = `Today's Lunch menu is: **${todayMenu?.lunch || 'Rajma Masala, Basmati Rice, Jeera Aloo, Curd'}**. Timings are 12:30 PM - 2:00 PM.`;
    else if (/breakfast/i.test(q)) mealInfo = `Breakfast today is: **${todayMenu?.breakfast || 'Masala Dosa, Sambar, Coconut Chutney, Tea/Coffee'}**. Timings are 7:30 AM - 9:00 AM.`;
    else mealInfo = `Here is today's meal schedule:\n- **Breakfast**: ${todayMenu?.breakfast || 'Dosa & Sambar'}\n- **Lunch**: ${todayMenu?.lunch || 'Rajma & Rice'}\n- **Snacks**: ${todayMenu?.snacks || 'Samosa & Chai'}\n- **Dinner**: ${todayMenu?.dinner || 'Special Dinner'}`;
    return {
      reply: mealInfo,
      source: 'grounded-engine'
    };
  }

  if (/complaint|status|wifi|fan|leak|tap|repair/i.test(q)) {
    if (complaints.length > 0) {
      const c = complaints[0];
      return {
        reply: `You have an active complaint (#${c.id}) titled **"${c.title}"**. Current Status: **${c.status}** (Assigned to: ${c.assigned_to || c.department}). ${c.resolution_notes ? `Latest update: "${c.resolution_notes}"` : 'Our technician has been notified.'}`,
        source: 'grounded-engine'
      };
    } else {
      return {
        reply: "You currently have no pending complaints! If something needs maintenance, click the '+ New Complaint' button on your dashboard to log it.",
        source: 'grounded-engine'
      };
    }
  }

  if (/room change|shift|transfer|different room/i.test(q)) {
    return {
      reply: `To request a room change, go to the **My Room** tab and click **"Request Room Change"**. Specify your preferred block and reason. The Warden reviews requests based on available vacancies at the beginning of each cycle.`,
      source: 'grounded-engine'
    };
  }

  if (/timing|curfew|gate|entry|out pass|gate pass|outing/i.test(q)) {
    return {
      reply: `Hostel curfew is **09:30 PM sharp**. Night biometric attendance runs from **9:30 PM to 10:15 PM**. For night outs or day outings beyond campus, apply for a **Digital Gate Pass** through the Gate Pass tab before 5:00 PM.`,
      source: 'grounded-engine'
    };
  }

  if (/notice|announcement|news|update/i.test(q)) {
    if (notices.length > 0) {
      const topNotice = notices[0];
      return {
        reply: `Latest Notice: **${topNotice.title}** (${topNotice.priority} priority, dated ${topNotice.date}). Details: "${topNotice.description}". You can view all notices on your Notice Board tab.`,
        source: 'grounded-engine'
      };
    }
  }

  if (/roommate|room mate|who is in my room/i.test(q)) {
    if (room?.roommates?.length > 0) {
      return {
        reply: `You are in **Room ${room.room_number}** (${room.block_name}). Your roommate is **${room.roommates[0].name}** (Phone: ${room.roommates[0].phone}).`,
        source: 'grounded-engine'
      };
    } else {
      return {
        reply: `You are in **Room ${room?.room_number || 'B-204'}**. No other roommates are registered currently.`,
        source: 'grounded-engine'
      };
    }
  }

  return {
    reply: `Hello ${student?.name || 'there'}! I can help you with today's mess menu, checking your complaint status, room change procedures, hostel curfew timings, or recent university notices. How can I assist you today?`,
    source: 'grounded-engine'
  };
}
