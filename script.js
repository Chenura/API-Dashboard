const sendBtn = document.getElementById("sendBtn");
const responseBox = document.getElementById("response");
const statusText = document.getElementById("status");
const copyBtn = document.getElementById("copyBtn");
const saveBtn = document.getElementById("saveRequest");
const savedList = document.getElementById("savedList");
const historyList = document.getElementById("historyList");

sendBtn.addEventListener("click", async () => {

  const method = document.getElementById("method").value;
  const url = document.getElementById("url").value;
  const body = document.getElementById("body").value;
  const headersInput = document.getElementById("headers").value;

  responseBox.textContent = "Loading...";

  try{

    let headers = {};

    if(headersInput.trim() !== ""){
      headers = JSON.parse(headersInput);
    }

    const authType = document.getElementById("authType").value;
    const authValue = document.getElementById("authValue").value;

    if(authType === "bearer"){
      headers["Authorization"] = `Bearer ${authValue}`;
    }

    if(authType === "apikey"){
      headers["x-api-key"] = authValue;
    }

    let finalUrl = url;

    const envVars = JSON.parse(
      document.getElementById("envVars").value
    );

    for(const key in envVars){

      finalUrl = finalUrl.replace(
        `{{${key}}}`,
        envVars[key]
      );

    }

    const options = {
      method: method === "GRAPHQL" ? "POST" : method,
      headers
    };

    if(method !== "GET"){
      options.body = body;
    }

    const response = await fetch(finalUrl, options);

    const data = await response.text();

    statusText.textContent = `${response.status} ${response.statusText}`;

    try{
      responseBox.textContent = JSON.stringify(JSON.parse(data), null, 2);
    }catch{
      responseBox.textContent = data;
    }

    hljs.highlightAll();

    saveHistory(finalUrl, method);

  }catch(error){

    statusText.textContent = "Request Failed";
    responseBox.textContent = error;

  }

});

copyBtn.addEventListener("click", () => {

  navigator.clipboard.writeText(responseBox.textContent);

  copyBtn.textContent = "Copied!";

  setTimeout(() => {
    copyBtn.textContent = "Copy";
  },1500);

});

saveBtn.addEventListener("click", () => {

  const request = {
    method: document.getElementById("method").value,
    url: document.getElementById("url").value,
    headers: document.getElementById("headers").value,
    body: document.getElementById("body").value
  };

  let requests = JSON.parse(localStorage.getItem("requests")) || [];

  requests.push(request);

  localStorage.setItem("requests", JSON.stringify(requests));

  loadRequests();

});

function loadRequests(){

  savedList.innerHTML = "";

  const requests = JSON.parse(localStorage.getItem("requests")) || [];

  requests.forEach(req => {

    const li = document.createElement("li");

    li.textContent = `${req.method} - ${req.url}`;

    li.onclick = () => {

      document.getElementById("method").value = req.method;
      document.getElementById("url").value = req.url;
      document.getElementById("headers").value = req.headers;
      document.getElementById("body").value = req.body;

    };

    savedList.appendChild(li);

  });

}

function saveHistory(url, method){

  let history = JSON.parse(localStorage.getItem("history")) || [];

  history.unshift({
    url,
    method,
    time:new Date().toLocaleString()
  });

  localStorage.setItem("history", JSON.stringify(history));

  loadHistory();

}

function loadHistory(){

  historyList.innerHTML = "";

  const history = JSON.parse(localStorage.getItem("history")) || [];

  history.forEach(item => {

    const li = document.createElement("li");

    li.textContent = `${item.method} - ${item.url} (${item.time})`;

    historyList.appendChild(li);

  });

}

loadRequests();
loadHistory();

let currentTab = 1;

const tabs = document.getElementById("tabs");

function createTab(){

  const tab = document.createElement("button");

  tab.textContent = `Tab ${currentTab++}`;

  tabs.appendChild(tab);

}

createTab();

document.getElementById("newTab")
.addEventListener("click", createTab);

const wsMessages = document.getElementById("wsMessages");

document.getElementById("connectWS")
.addEventListener("click", () => {

  const wsUrl = document.getElementById("wsUrl").value;

  const socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    wsMessages.innerHTML += `<p>Connected to ${wsUrl}</p>`;
  };

  socket.onmessage = (event) => {
    wsMessages.innerHTML += `<p>${event.data}</p>`;
  };

  socket.onerror = () => {
    wsMessages.innerHTML += `<p>Connection Failed</p>`;
  };

});

document.getElementById("exportBtn")
.addEventListener("click", () => {

  const data = localStorage.getItem("requests");

  const blob = new Blob(
    [data],
    {type:"application/json"}
  );

  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);

  a.download = "collections.json";

  a.click();

});

document.getElementById("importFile")
.addEventListener("change", (e) => {

  const file = e.target.files[0];

  const reader = new FileReader();

  reader.onload = () => {

    localStorage.setItem(
      "requests",
      reader.result
    );

    loadRequests();

  };

  reader.readAsText(file);

});
