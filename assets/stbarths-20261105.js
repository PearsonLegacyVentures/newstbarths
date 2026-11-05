const modal=document.querySelector("#bookingModal"),form=document.querySelector("#bookingForm");
const serviceNames={swedish:"Swedish Massage",deep:"Deep Tissue Massage",couples:"Couples Massage",sports:"Sports Massage",villa:"Villa Massage",hotel:"Hotel / In-Room Massage",yacht:"Yacht Massage",mobile:"Mobile Massage"};
function openBooking(service="swedish",duration="60"){if(!modal||!form)return;modal.classList.add("open");document.body.style.overflow="hidden";if(form.service)form.service.value=service;if(form.duration)form.duration.value=duration}
function closeBooking(){if(!modal)return;modal.classList.remove("open");document.body.style.overflow=""}
document.addEventListener("click",e=>{const b=e.target.closest("[data-book]");if(b){e.preventDefault();openBooking(b.dataset.service||"swedish",b.dataset.duration||"60")}if(e.target.matches("[data-close]")||e.target===modal)closeBooking()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeBooking()});
document.querySelectorAll(".faq-q").forEach(b=>b.addEventListener("click",()=>b.parentElement.classList.toggle("open")));
document.querySelectorAll(".pay-card").forEach(card=>card.addEventListener("click",()=>{document.querySelectorAll(".pay-card").forEach(x=>x.classList.remove("selected"));card.classList.add("selected");card.querySelector("input").checked=true}));

const PRICE_LIST={swedish:{60:207,90:299},deep:{60:207,90:299},couples:{60:414,90:598},sports:{60:207,90:299}};
const SETTING_SERVICES=new Set(["villa","hotel","mobile"]);
const input=name=>form?.elements.namedItem(name);
const euro=amount=>new Intl.NumberFormat("en-IE",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(amount);
function stBarthsClock(instant){
  const p=new Intl.DateTimeFormat("en-GB",{timeZone:"America/St_Barthelemy",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(instant);
  const get=name=>p.find(part=>part.type===name)?.value;
  return {date:get("year")+"-"+get("month")+"-"+get("day"),time:get("hour")+":"+get("minute")};
}
function earliestTime(duration){
  const cutoffInstant=new Date(Date.now()+5*60*60*1000+59999);
  let cutoff=stBarthsClock(cutoffInstant);
  if(cutoff.time>(duration===90?"16:30":"17:00"))cutoff={date:stBarthsClock(new Date(cutoffInstant.getTime()+24*60*60*1000)).date,time:"10:00"};
  return cutoff;
}
function chosenOrder(){
  const service=input("service")?.value||"swedish";
  const treatment=SETTING_SERVICES.has(service)?input("treatment")?.value||"swedish":service;
  const duration=Number(input("duration")?.value||60);
  const quantity=Number(input("quantity")?.value||1);
  const unit=PRICE_LIST[treatment]?.[duration];
  return {service,treatment,duration,quantity,totalEur:unit==null?null:unit*quantity};
}
function validateTime(date,time){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date||"")||!/^\d{2}:\d{2}$/.test(time||""))return "Please choose an appointment date and time.";
  if(time<"10:00"||time>(Number(input("duration")?.value)===90?"16:30":"17:00"))return "Please choose a time that lets your massage finish by 6:00 PM (St. Barths time).";
  const instant=new Date(date+"T"+time+":00-04:00").getTime();
  if(!Number.isFinite(instant)||stBarthsClock(new Date(instant)).date!==date)return "Please choose a valid appointment date.";
  if(instant<Date.now()+5*60*60*1000)return "Bookings require at least 5 hours' notice. Please choose a later time (St. Barths local time).";
  return "";
}
function showFormError(message){
  const node=form?.querySelector(".booking-validation-error");
  if(!node)return;
  node.textContent=message;
  node.hidden=false;
  node.scrollIntoView({behavior:"smooth",block:"nearest"});
}
function syncOrder(){
  if(!form)return;
  const order=chosenOrder();
  const treatmentField=form.querySelector(".booking-treatment-field");
  if(treatmentField)treatmentField.hidden=!SETTING_SERVICES.has(order.service);
  const quantityLabel=form.querySelector(".booking-quantity-field label");
  if(quantityLabel)quantityLabel.textContent=order.treatment==="couples"?"Number of couples":"Number of guests";
  const totalEl=form.querySelector("#bookingOrderTotal");
  if(totalEl)totalEl.textContent=order.totalEur===null?"Custom quote required":euro(order.totalEur);
  const detailsEl=form.querySelector("#bookingOrderDetails");
  if(detailsEl)detailsEl.textContent=(serviceNames[order.service]||order.service)+(SETTING_SERVICES.has(order.service)?" — "+(serviceNames[order.treatment]||order.treatment):"")+" · "+order.duration+" minutes · "+order.quantity+" "+(order.treatment==="couples"?"couple(s)":"guest(s)")+(order.totalEur===null?" · Price confirmed before payment":"");
  const cutoff=earliestTime(order.duration),dateField=input("date"),timeField=input("time");
  if(dateField)dateField.min=cutoff.date;
  if(timeField){timeField.min=dateField?.value===cutoff.date&&cutoff.time>"10:00"?cutoff.time:"10:00";timeField.max=order.duration===90?"16:30":"17:00";}
  const warning=form.querySelector(".booking-validation-error");
  if(warning)warning.hidden=true;
}
function enhanceBooking(){
  if(!form||form.dataset.bookingEnhanced)return;
  form.dataset.bookingEnhanced="true";
  const serviceField=input("service")?.closest(".field"),durationField=input("duration")?.closest(".field");
  const timeField=input("time")?.closest(".field"),paymentField=form.querySelector(".pay-choice")?.closest(".field");
  if(!serviceField||!durationField||!timeField||!paymentField)return;
  const treatment=document.createElement("div");
  treatment.className="field booking-treatment-field";
  treatment.innerHTML='<label for="bookingTreatment">Treatment</label><select id="bookingTreatment" name="treatment"><option value="swedish">Swedish Massage</option><option value="deep">Deep Tissue Massage</option><option value="couples">Couples Massage</option><option value="sports">Sports Massage</option></select>';
  serviceField.after(treatment);
  const quantity=document.createElement("div");
  quantity.className="field booking-quantity-field";
  quantity.innerHTML='<label for="bookingQuantity">Number of guests</label><input id="bookingQuantity" type="number" name="quantity" value="1" min="1" max="10" step="1" required>';
  durationField.after(quantity);
  const hint=document.createElement("p");
  hint.className="booking-time-hint field full";
  hint.textContent="Booking hours: 10:00 AM–6:00 PM, St. Barths time. Sessions finish by 6 PM. At least 5 hours' notice is required.";
  timeField.after(hint);
  const total=document.createElement("div");
  total.className="field full booking-price-summary";
  total.setAttribute("aria-live","polite");
  total.innerHTML='<div class="booking-price-line"><span>Your order total</span><strong id="bookingOrderTotal">€207</strong></div><small id="bookingOrderDetails">Swedish Massage · 60 minutes · 1 guest</small><small>No payment is taken when you submit a request. All prices in EUR.</small>';
  paymentField.before(total);
  const error=document.createElement("div");
  error.className="booking-validation-error";
  error.setAttribute("role","alert");
  error.hidden=true;
  form.querySelector('button[type="submit"]').before(error);
  for(const type of ["change","input"])form.addEventListener(type,e=>{if(["service","duration","treatment","quantity","date","time"].includes(e.target.name))syncOrder()});
  syncOrder();
}
const openOriginal=openBooking;
openBooking=function(service="swedish",duration="60"){
  const success=modal?.querySelector(".booking-confirmation");
  if(success){success.remove();form.hidden=false;form.reset();}
  openOriginal(service,duration);
  enhanceBooking();
  syncOrder();
};
function successRow(list,label,value){
  const item=document.createElement("div");
  const labelEl=document.createElement("span");labelEl.textContent=label;
  const valueEl=document.createElement("strong");valueEl.textContent=String(value??"");
  item.append(labelEl,valueEl);list.append(item);
}
function showSuccess(payload,result,order){
  const summary=document.createElement("section");
  summary.className="success booking-confirmation";
  summary.innerHTML='<div class="success-check">✓</div><p class="eyebrow">REQUEST RECEIVED</p><h2>We have your St. Barths massage request.</h2><p>Your appointment remains pending until therapist availability is confirmed.</p>';
  const reference=document.createElement("p");reference.textContent="Reference: "+result.reference;summary.append(reference);
  const sent=document.createElement("p");sent.textContent="A confirmation email has been sent to "+payload.email+".";summary.append(sent);
  const list=document.createElement("div");list.className="success-summary";
  successRow(list,"Service",serviceNames[payload.service]||payload.service);
  successRow(list,"Treatment",serviceNames[payload.treatment]||payload.treatment);
  successRow(list,"Quantity",order.quantity+" "+(order.treatment==="couples"?"couple(s)":"guest(s)"));
  successRow(list,"Duration",order.duration+" minutes");
  successRow(list,"Date",payload.date);
  successRow(list,"Time (St. Barths)",payload.time);
  successRow(list,"Location",payload.location);
  successRow(list,"Order total",typeof result.totalEur==="number"?euro(result.totalEur):"Custom quote required");
  successRow(list,"Payment",payload.payment==="pay"?"Pay online after confirmation":"Pay in person");
  summary.append(list);
  const note=document.createElement("p");note.className="booking-success-note";
  note.textContent=result.totalEur===null?"We will confirm your custom quote before payment.":"No payment has been taken. We will confirm your appointment before collecting payment.";
  summary.append(note);
  const close=document.createElement("button");close.className="btn btn-dark";close.dataset.close="true";close.textContent="Close";summary.append(close);
  form.hidden=true;form.after(summary);
}
if(form){
  enhanceBooking();
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    const order=chosenOrder(),data=new FormData(form);
    if(!Number.isInteger(order.quantity)||order.quantity<1||order.quantity>10){showFormError("Choose between 1 and 10 guests/couples.");return;}
    const error=validateTime(String(data.get("date")),String(data.get("time")));
    if(error){showFormError(error);return;}
    const payload={service:order.service,treatment:order.treatment,duration:String(order.duration),quantity:order.quantity,date:data.get("date"),time:data.get("time"),location:data.get("location"),name:data.get("name"),phone:data.get("phone"),email:data.get("email"),payment:data.get("payment"),notes:data.get("notes")||"",website:data.get("website")||"",source:location.href};
    const btn=form.querySelector('button[type="submit"]'),original=btn.textContent;
    btn.disabled=true;btn.textContent="Sending request…";
    try{
      const r=await fetch("/api/booking-request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const result=await r.json();
      if(!r.ok)throw new Error(result.error||"Booking request could not be sent.");
      showSuccess(payload,result,order);
    }catch(ex){showFormError(ex.message||"We couldn't send your request. Please try again or use Need help.");}
    finally{btn.disabled=false;btn.textContent=original;}
  });
}
document.querySelectorAll("[data-gallery]").forEach(el=>el.addEventListener("click",()=>{const lb=document.querySelector("#lightbox"),im=document.querySelector("#lightboxImage");im.src=el.dataset.gallery;lb.classList.add("open");document.body.style.overflow="hidden"}));document.addEventListener("click",e=>{const lb=document.querySelector("#lightbox");if(e.target.matches("[data-lightbox-close]")||e.target===lb){lb?.classList.remove("open");document.body.style.overflow=""}});
(()=>{const d=document.createElement("div");d.className="contact-dock";d.innerHTML='<div class="contact-menu" hidden><span>Need help booking?</span><a href="https://wa.me/12428168286" target="_blank"><b>WhatsApp</b><small>Message our concierge</small></a><a href="sms:+12428168286"><b>iMessage / Text</b><small>+1 (242) 816-8286</small></a></div><button class="contact-trigger">Need help?</button>';document.body.appendChild(d);const m=d.querySelector(".contact-menu"),b=d.querySelector(".contact-trigger");b.onclick=()=>m.hidden=!m.hidden})();