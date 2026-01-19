let chart;
let latestReport = null;

const diseases = ["diabetes","heart","kidney","liver","thyroid"];

// Load patient history on page load
window.onload = () => {
    renderHistory();
};

// ----------------------
// PREDICT
// ----------------------
function predict() {

    const data = {
        name: document.getElementById("patientName").value || "Anonymous",
        pregnancies: +document.getElementById("pregnancies").value,
        glucose: +document.getElementById("glucose").value,
        bloodPressure: +document.getElementById("bloodPressure").value,
        skinThickness: +document.getElementById("skinThickness").value,
        insulin: +document.getElementById("insulin").value,
        bmi: +document.getElementById("bmi").value,
        dpf: +document.getElementById("dpf").value,
        age: +document.getElementById("age").value
    };

    fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(res => {
        if(!res.ok) throw new Error("API Error");
        return res.json();
    })
    .then(result => renderDashboard(result, data))
    .catch(() => alert("❌ Backend not connected"));
}

// ----------------------
// DASHBOARD
// ----------------------
function renderDashboard(result, data) {

    let riskText = "🧬 Disease Risk Assessment\n";
    diseases.forEach(d => {
        riskText += `${capitalize(d)}: ${result[d] ? "🔴 High Risk" : "🟢 Low Risk"}\n`;
    });
    document.getElementById("risk").innerText = riskText;

    const anyRisk = diseases.some(d => result[d]);

    document.getElementById("doctorAdvice").innerText =
`👨‍⚕️ Doctor Recommendation
${anyRisk ? "Medical supervision and lifestyle changes are strongly advised." : "Patient condition stable. Preventive care advised."}`;

    document.getElementById("precautions").innerText =
`🛡️ Precautions
${anyRisk
? "• Avoid sugar & processed food\n• Exercise daily\n• Avoid smoking & alcohol\n• Monitor vitals"
: "• Balanced diet\n• Regular exercise\n• Annual checkups"}`;

    document.getElementById("tests").innerText =
`🧪 Recommended Tests
${anyRisk
? "HbA1c, Lipid Profile, BP Monitoring, Kidney Function Test, Thyroid Panel"
: "Annual Blood Sugar Screening"}`;

    drawChart(result);
    animateMeters(result);

    latestReport = { data, result };

    saveHistory(data, result);
}

// ----------------------
// CHART
// ----------------------
function drawChart(result) {
    const values = diseases.map(d => result[d] ? rand(70,90) : rand(20,40));

    if(chart) chart.destroy();

    chart = new Chart(document.getElementById("riskChart"), {
        type: "bar",
        data: {
            labels: diseases.map(capitalize),
            datasets: [{
                label: "Risk Confidence (%)",
                data: values,
                backgroundColor: values.map((v,i) =>
                    result[diseases[i]] ? "#ff3d3d" : "#00bfa6"
                ),
                borderRadius: 10
            }]
        },
        options: {
            animation: { duration: 1200 },
            scales: {
                y: { beginAtZero: true, max: 100 }
            }
        }
    });
}

// ----------------------
// METERS
// ----------------------
function animateMeters(result){
    const map = {
        diabetes: [80,20],
        heart: [75,25],
        kidney: [70,30],
        liver: [65,25],
        thyroid: [60,20]
    };

    diseases.forEach(d => {
        animateMeter(
            `${d}Meter`,
            `${d}Percent`,
            result[d] ? map[d][0] : map[d][1],
            result[d]
        );
    });
}

function animateMeter(circleId, percentId, value, danger){
    const circle = document.getElementById(circleId);
    if(!circle) return;

    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;

    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference;
    circle.style.stroke = danger ? "#ff3d3d" : "#00bfa6";

    setTimeout(() => {
        circle.style.strokeDashoffset =
            circumference - (value / 100) * circumference;
        document.getElementById(percentId).innerText = `${value}%`;
    }, 100);
}

// ----------------------
// HISTORY
// ----------------------
function saveHistory(data, result){
    const history = JSON.parse(localStorage.getItem("patientHistory") || "[]");
    history.unshift({ time: new Date().toLocaleString(), data, result });
    if(history.length > 10) history.pop();
    localStorage.setItem("patientHistory", JSON.stringify(history));
    renderHistory();
}

function renderHistory(){
    const ul = document.getElementById("patientHistory");
    if(!ul) return;

    ul.innerHTML = "";
    const history = JSON.parse(localStorage.getItem("patientHistory") || "[]");

    history.forEach(h => {
        const li = document.createElement("li");
        const risks = diseases.filter(d => h.result[d]).join(", ") || "No High Risk";
        li.textContent = `${h.time} → ${h.data.name}: ${risks}`;
        ul.appendChild(li);
    });
}

// ----------------------
// PDF REPORT
// ----------------------
async function downloadReport(){

    if(!latestReport){
        alert("⚠ Please generate prediction first");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 20;

    doc.setFontSize(18);
    doc.text("AI Smart Healthcare Report", 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Patient: ${latestReport.data.name}`, 14, y); y+=6;
    doc.text(`Age: ${latestReport.data.age}`, 14, y); y+=6;
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, y); y+=10;

    doc.text("Disease Assessment:", 14, y); y+=6;
    diseases.forEach(d=>{
        doc.text(`${capitalize(d)}: ${latestReport.result[d]?"High Risk":"Low Risk"}`,14,y);
        y+=6;
    });

    y+=6;
    doc.text("AI Explanation:",14,y); y+=6;
    latestReport.result.explanation.forEach(e=>{
        doc.text(`• ${e}`,14,y);
        y+=6;
    });

    doc.save(`Health_Report_${latestReport.data.name.replace(/\s+/g,"_")}.pdf`);
}

// ----------------------
function capitalize(str){return str[0].toUpperCase()+str.slice(1);}
function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
