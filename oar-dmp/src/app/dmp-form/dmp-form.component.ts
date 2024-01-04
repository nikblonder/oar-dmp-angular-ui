import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ObservedValueOf, Subscription } from "rxjs";
import { FormBuilder, Validators } from '@angular/forms';
import { BasicInfoComponent } from '../form-components/basic-info/basic-info.component';
import { PersonelComponent } from '../form-components/personel/personel.component';
import { KeywordsComponent } from '../form-components/keywords/keywords.component';
import { StorageNeedsComponent } from '../form-components/technical-requirements/technical-requirements.component';
import { EthicalIssuesComponent } from '../form-components/ethical-issues/ethical-issues.component';
import { DataDescriptionComponent } from '../form-components/data-description/data-description.component';
import { DataPreservationComponent } from '../form-components/data-preservation/data-preservation.component';
import { DMP_Meta } from '../types/DMP.types';
import { DmpService } from '../shared/dmp.service'
import { SubmitDmpService } from '../shared/submit-dmp.service';//for acknowledging when form button has been 'pressed'
import { FormControl } from '@angular/forms';




// for Communicating with backend services using HTTP
import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
/**
 * The HttpClient service makes use of observables for all transactions. You must import the RxJS observable and 
 * operator symbols that appear in the example snippets. These ConfigService imports are typical.
 */
// import { Observable, throwError } from 'rxjs';
// import { catchError, retry } from 'rxjs/operators';

import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { DomPositioningModule } from '../shared/dom-positioning.module';
import { DmpPdf } from './dmp-pdf';


//  Interface for the DMP interface. This is where we define observed values of
//  different DMP form components
interface DMPForm {
  basicInfo?: ObservedValueOf<BasicInfoComponent["formReady"]>;
  personel?: ObservedValueOf<PersonelComponent["formReady"]>;
  keyWordsAndPhrases?:ObservedValueOf<KeywordsComponent["formReady"]>;
  technicalRequirements?:ObservedValueOf<StorageNeedsComponent["formReady"]>;
  ethicalIssues?: ObservedValueOf<EthicalIssuesComponent["formReady"]>;
  dataDescription?: ObservedValueOf<DataDescriptionComponent["formReady"]>;
  dataPreservation?: ObservedValueOf<DataPreservationComponent["formReady"]>;
  
}

// In the example above we have a number of child components: 
// BasicInfoComponent through StorageNeedsComponent, 
// which are combined into the main form group as basicInfo through dataPreservation. 
// We define them all as optional because initially our form group will 
// be empty until the first child component has emitted its formReady event.

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable'

@Component({
  selector: 'app-dmp-form',
  templateUrl: './dmp-form.component.html',
  styleUrls: ['./dmp-form.component.scss']
})
@Injectable()
export class DmpFormComponent implements OnInit {
  formButtonSubscription!: Subscription | null;
  formButtonMessage: string = "";
  // get access to methods in DataDescriptionComponent child.

  // this is for the purpose of reseting checkboxes.
  @ViewChild(DataDescriptionComponent) dataCategoriesCheckBoxes!:DataDescriptionComponent;
  // For reseting radio buttons to "no" and enabling hiding of text boxes
  @ViewChild(EthicalIssuesComponent) ethicalIssuesRadioBtns!: EthicalIssuesComponent;
  // For clearing the keywords / phrases table
  @ViewChild(KeywordsComponent) keyWordsTable!: KeywordsComponent;
  // For clearing data preservation links
  @ViewChild(DataPreservationComponent) preservationLinksTable!: DataPreservationComponent;
  // For clearing Technical resources table
  @ViewChild(StorageNeedsComponent) technicalRequirementsTable!: StorageNeedsComponent;
  // For clearing Contributors resources table
  @ViewChild(PersonelComponent) personnelForm!: PersonelComponent;
 
  // We want to load the initial data via service and provide it to the child components. 
  // Assuming that we have a DMP object I call that property initialDMP:
  /**
   * The initial data received from the backend.
   * Remove this if you don't have any initial form data.
   */
  initialDMP?: DMP_Meta;

  /**
   * The current form data, provided by the child forms.
   * This will be sent to the backend when submitting the form.
   */
  dmp?: DMP_Meta;

   // We create our form group using the DMPForm interface that's been defined above
  form = this.fb.group({
    // Form is empty for now -> child form groups will be added dynamically

  });

  name = new FormControl('');
  nameDisabled = false;
  nameClass:string = "mnemonicNameNew";

  DMP_PDF?:DmpPdf;

  constructor(
    private fb: FormBuilder, 
    private dmp_Service: DmpService, 
    private route: ActivatedRoute,
    private router: Router,
    private dom:DomPositioningModule,
    private form_buttons:SubmitDmpService
    // private http: HttpClient
    ) {  }

  action:string = "";
  id:string | null = null;

  ngOnInit(): void {
    console.log("dmp-form component OnInit");
    this.formButtonSubscribe();
    this.id = this.route.snapshot.paramMap.get('id')
    this.route.data.subscribe(data  => {
      this.action = data["action"] ;
      if (this.action === "edit"){
        this.nameClass = "mnemonicNameDisabled"
        this.nameDisabled = true;
      }
      else{
        this.nameClass = "mnemonicNameNew"
        this.nameDisabled = false;
      }
    });
    // Fetch initial data from the backend
    this.dmp_Service.fetchDMP(this.action, this.id).subscribe(
      {
        next: data => {
          if (this.id !==null){
            this.initialDMP = data.data;
            this.dmp = data.data;
            this.name.setValue(data.name);
            // this.name.value = data.name
          }
          else{
            this.initialDMP = data;
            this.dmp = data;
            // this.name.value = '';
          }
        },
        error: error => {
          console.log(error.message);
          this.router.navigate(['error', { dmpError: this.buildErrorMessage(error) }]);
            
        }
      }
    );    

  }

  ngAfterViewInit(): void {
  
  }

  //subscribe to button subjects
  formButtonSubscribe(){
    if (!this.formButtonSubscription) {
      //subscribe if not already subscribed
      this.formButtonSubscription = this.form_buttons.buttonSubject$.subscribe({
        next: (message) => {
          // the message is not relevant here. it is just a trigger to reset the form
          this.formButtonMessage = message;
          if (this.formButtonMessage === "Reset"){
            this.resetDmp();
          }
          else if (this.formButtonMessage === "Save Draft"){
            this.saveDraft();
          }
          else if (this.formButtonMessage === "PDF Export"){
            // this.generatePdf();
            this.generatePdfFromClass();
            // this.screenshotPDF();
          }
          
        }
      });
    }

  }

  

  // We need a method to register the child form groups. The method accepts a name 
  // (here "basicInfo" through "technical-requirements") and the form group. 
  // Thanks to TypeScript this is fully typed - the name and the group must match 
  // the form interface. Providing an invalid name or a form group that doesn't match 
  // the name would result in an error.
  addChildForm<K extends keyof DMPForm>(
    name: K,
    group: Exclude<DMPForm[K], undefined>
  ) {
    // And in our template we can render all child components and register the formReady event.
    this.form.setControl(name, group);
  }

  // Our parent component should listen to any value changes in the child components. 
  // For that we create another dmp property (dmp?: DMP_Meta;) that will contain the 
  // latest value and add a patchDMP() method to update the dmp.
  patchDMP(patch: Partial<DMP_Meta>) {
    // patch contains value changes in the child components
    if (!this.dmp) throw new Error("Missing DMP in patch");
    // Example of spread operatior (...)
    // let arr1 = [0, 1, 2];
    // const arr2 = [3, 4, 5];
    // arr1 = [...arr1, ...arr2];
    // arr1 is now [0, 1, 2, 3, 4, 5]    
    this.dmp = { ...this.dmp, ...patch };
  }

  onSubmit() {
    // For demo purposes make onSumit identical to saving a draft
    // later new logic will have to be implemented for proper proceduere
    // of submitting a DMP record for publishing
    this.saveDraft();

    
    // if (!this.dmp){
    //   alert("Cannot save DMP. Missing DMP in submit")
    //   throw new Error("Missing DMP in submit");
    // }
    // if (this.name.value === '') {
    //   alert("Cannot save DMP. Record name is empty.")
    //   throw new Error("Record name is empty");
    // }
    // this.dmp_Service.createDMP(this.dmp, this.name.value).subscribe(
    //   {
    //     next: data => {
    //         this.router.navigate(['success']);
    //     },
    //     error: error => {
    //       console.log(error.message);
    //       this.router.navigate(['error', { dmpError: this.buildErrorMessage(error) }]);
    //     }
    //   }
    // );
  }

  saveDraft(){
    if (!this.dmp){
      alert("Cannot save DMP. Record name is empty. Missing DMP in submit")
      throw new Error("Missing DMP in submit");
    } 
    if (this.name.value === '') {
      alert("Cannot save DMP. Record name is empty.")
      throw new Error("Record name is empty");
    }
    if (!this.personnelForm.isValidPrimaryContactOrcid()){
      alert("Cannot save DMP. Ivalid ORCID format for the prmary NIST contact. The correct format is numeric and of the form xxxx-xxxx-xxxx-xxxx")
      throw new Error("Invalid ORCID for prmary NIST contact.");
    }
    if (this.id !==null){
      // If id is not null then update dmp with the current id
      this.dmp_Service.updateDMP(this.dmp, this.id).subscribe(
        {
          next: data => {
            //try to reload the page to read the saved dmp from mongodb
            this.router.navigate(['edit', this.id]);
            alert("Successfuly saved draft of the data");
          },
          error: error => {
            console.log(error.message);
            this.router.navigate(['error', { dmpError: this.buildErrorMessage(error) }]);
          }
          
        }
      );
    }
    else {
      //create a new DMP
      this.dmp_Service.createDMP(this.dmp, this.name.value).subscribe(
        {
          next: data => {
            this.router.navigate(['edit', data.id]);
          },
          error: error => {
            console.log(error.message);
            this.router.navigate(['error', { dmpError: this.buildErrorMessage(error) }]);
          }
        }
      );
    }
    
  }

  resetDmp(){
    this.form.controls['basicInfo'].reset();
    this.form.controls['basicInfo'].patchValue({
      organizations:[]
  })
    this.form.controls['ethicalIssues'].reset();
    this.form.controls['ethicalIssues'].patchValue({
        ethicalIssue:"no",
        ethicalPII:"no"
    })

    this.personnelForm.resetPersonnelForm();
    this.keyWordsTable.clearKeywordsTable();

    // this.form.controls['technicalRequirements'].reset();
    this.technicalRequirementsTable.resetTechnicalRequirements();
    
    this.ethicalIssuesRadioBtns.resetRadioButtons();
    this.form.controls['dataDescription'].reset();
    // We have to set this one separately because it is an array
    // so once form reset is done to it, new data can't be appended
    // so we have to set it back to an empty array.
    this.form.controls['dataDescription'].patchValue({
      dataCategories: []
    })
    // This sends signal to DataDescriptionComponent to reset checkboxes
    this.dataCategoriesCheckBoxes.resetCheckboxes();

    // Reset Data Preservation component of the form
    this.form.controls['dataPreservation'].patchValue({
      preservationDescription:"",
      dataAccess:"",
      pathsURLs: []
    })

    this.preservationLinksTable.clearTable();
  }

  buildErrorMessage(error:any){

    let errorMessage = " ";
    if (error.status){
      errorMessage += error.status + " ";
    }
    if (error.statusText){
      errorMessage += error.statusText + " ";
    }
    return errorMessage;

  }

  screenshotPDF(){
    //capture full screenshot of the DMP form

    let DATA: any = document.getElementById('dmp_panel');
    let PDF = new jsPDF('p', 'mm', 'a4');
    html2canvas(DATA).then((canvas) => {
      var imgData = canvas.toDataURL('image/png');

      /*
      Here are the numbers (paper width and height) that I found to work. 
      It still creates a little overlap part between the pages, but good enough for me.
      if you can find an official number from jsPDF, use them.
      */
      var imgWidth = 210; 
      var pageHeight = 295;  
      var imgHeight = canvas.height * imgWidth / canvas.width;
      var heightLeft = imgHeight;

      var doc = new jsPDF('p', 'mm');
      var position = 0;

      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      doc.save('angular-demo.pdf');
    });

  }

  generatePdfFromClass() {
    // Create A4 size PDF document 
    // A4 measures 8.27 x 11.69 inches    
    const pdf = new jsPDF('p', 'in', 'a4');
    const ppi = 72; // pixels per inch resolution
    const pageWidth = 8.27;
    const pageHeight = 11.69
    const margin = 0.5;
    let verticalOffset = 0.5;
    let lineFontSize = 35;
    this.DMP_PDF = new DmpPdf(pdf, margin);
    this.DMP_PDF.printHeader("Data Management Plan", 0.1, "#707b7c");
    this.DMP_PDF.printHeader("Basic Information", 0.05, "#d5d8dc", 20);

    // Title
    if (this.dmp?.title !== undefined && this.dmp?.title !== null){
      this.DMP_PDF.printTextField("Title", this.dmp?.title);
    }

    // Start Date
    if (this.dmp?.startDate !== undefined && this.dmp?.startDate !== null){
      this.DMP_PDF.printTextField("Start Date", this.dmp?.startDate);
    }

    // End Date
    if (this.dmp?.endDate !== undefined && this.dmp?.endDate !== null){
      this.DMP_PDF.printTextField("End Date", this.dmp?.endDate);
    }

    // Make DMP searchable
    if (this.dmp?.dmpSearchable !== undefined && this.dmp?.dmpSearchable !== null){
      this.DMP_PDF.printTextField("Make DMP Searchable", this.dmp?.dmpSearchable);
    }

    //Funding
    if (this.dmp?.funding !== undefined){
      this.DMP_PDF.printTable("Funding", ["Grant Source","Grant ID"], [[this.dmp.funding.grant_source, this.dmp.funding.grant_id]]);
    }

    // Project Description
    if (this.dmp?.projectDescription !== undefined && this.dmp?.projectDescription !== null){
      this.DMP_PDF.printTextField("Project Description", this.dmp?.projectDescription);
    }

    //Organization(s) Associated With This DMP
    if(this.dmp?.organizations !== undefined){
      let tblHeaders = ["Org ID", "Organization(s)"];
      let tblData:Array<Array<string>>=[];
      for ( let i=0; i < this.dmp.organizations.length; i++){
        tblData.push([this.dmp.organizations[i].ORG_ID.toString(), this.dmp.organizations[i].name])
      }
      this.DMP_PDF.printTable("Organization(s) Associated With This DMP", tblHeaders, tblData);
    }

    // ========================== Researchers ============================

    this.DMP_PDF.printHeader("Researchers", 0.05, "#d5d8dc", 20);

    // Primary NIST Contact
    if (this.dmp?.primary_NIST_contact !== undefined){
      let tblHeaders = ["Name", "Surname", "ORCID"];
      let tblData = [[this.dmp.primary_NIST_contact.firstName, this.dmp.primary_NIST_contact.lastName, this.dmp.primary_NIST_contact.orcid]];
    
      this.DMP_PDF.printTable("Primary NIST Contact", tblHeaders, tblData);

    }

    // Contributors
    if (this.dmp?.contributors !== undefined){
      let tblHeaders = ["Name", "Surname", "Institution", "Role", "e-mail", "ORCID"];
      let tblData:Array<Array<string>>=[];

      for ( let i=0; i < this.dmp.contributors.length; i++){
        let currRow: Array<string> = [];
        currRow.push(this.dmp.contributors[i].contributor.firstName);
        currRow.push(this.dmp.contributors[i].contributor.lastName);
        currRow.push(this.dmp.contributors[i].institution);
        currRow.push(this.dmp.contributors[i].role);
        currRow.push(this.dmp.contributors[i].e_mail);
        currRow.push(this.dmp.contributors[i].contributor.orcid);
        tblData.push(currRow);
      }
      
      this.DMP_PDF.printTable("Contributors", tblHeaders, tblData);

    }    

    // ========================== Keywords / Phrases ============================

    this.DMP_PDF.printHeader("Keywords / Phrases", 0.05, "#d5d8dc", 20);

    //Keywords / Phrases
    if(this.dmp?.keyWords !== undefined){
      let tblHeaders = ["Keywords / Phrases"];
      let tblData:Array<Array<string>>=[];
      for ( let i=0; i < this.dmp.keyWords.length; i++){
        tblData.push([this.dmp.keyWords[i]])
      }
      this.DMP_PDF.printTable("", tblHeaders, tblData);
    }

    // =========================== Technical Requirements =========================

    this.DMP_PDF.printHeader("Technical Requirements", 0.05, "#d5d8dc", 20);

    //Estimated Data Size
    if(this.dmp?.dataSize !== undefined && this.dmp?.dataSize !== null){
      this.DMP_PDF.printTextField("Estimated Data Size", this.dmp?.dataSize + this.dmp.sizeUnit);
    }

    //Software Development
    if(this.dmp?.softwareDevelopment !== undefined && this.dmp?.softwareDevelopment !== null){
      this.DMP_PDF.printTextField("Software Development", this.dmp?.softwareDevelopment.development);

      //Software developed for this project will be for
      if(this.dmp?.softwareDevelopment.softwareUse !== ""){
        this.DMP_PDF.printTextField("Software developed for this project will be for", this.dmp?.softwareDevelopment.softwareUse);
      }

      //Does the software development require a database?
      if(this.dmp?.softwareDevelopment.softwareDatabase !== ""){
        this.DMP_PDF.printTextField("Does the software development require a database?", this.dmp?.softwareDevelopment.softwareDatabase);
      }

      //Will the software development produce a website interface?
      if(this.dmp?.softwareDevelopment.softwareWebsite !== ""){
        this.DMP_PDF.printTextField("Will the software development produce a website interface?", this.dmp?.softwareDevelopment.softwareWebsite);
      }
    }

    // Technical resources equipment needed/used
    if(this.dmp?.technicalResources !== undefined){
      let tblHeaders = ["Technical resources equipment needed/used"];
      let tblData:Array<Array<string>>=[];
      for ( let i=0; i < this.dmp.technicalResources.length; i++){
        tblData.push([this.dmp.technicalResources[i]])
      }
      this.DMP_PDF.printTable("", tblHeaders, tblData);
    }

    // ========================================= Ethical Issues ===========================

    this.DMP_PDF.printHeader("Ethical Issues", 0.05, "#d5d8dc", 20);

    if(this.dmp?.ethical_issues !== undefined){
      //Are there any ethical issues related to the data that this DMP describes?
      if(this.dmp?.ethical_issues.ethical_issues_exist !== ""){
        this.DMP_PDF.printTextField("Are there any ethical issues related to the data that this DMP describes?", 
                                    this.dmp?.ethical_issues.ethical_issues_exist);
      }

      //Describe any ethical issues raised in this project (human subjects etc)
      if(this.dmp?.ethical_issues.ethical_issues_description !== ""){
        this.DMP_PDF.printTextField("Describe any ethical issues raised in this project (human subjects etc)", 
                                    this.dmp?.ethical_issues.ethical_issues_description);
      }

      //Ethical issues report
      if(this.dmp?.ethical_issues.ethical_issues_report !== ""){
        this.DMP_PDF.printTextField("Ethical issues report", 
                                    this.dmp?.ethical_issues.ethical_issues_report);
      }

      // Does the data generated in this project contain PII or BII?
      if(this.dmp?.ethical_issues.dmp_PII !== ""){
        this.DMP_PDF.printTextField("Does the data generated in this project contain PII or BII?", 
                                    this.dmp?.ethical_issues.dmp_PII);
      }
    }

    // ========================================= Data Description ===========================

    this.DMP_PDF.printHeader("Data Description", 0.05, "#d5d8dc", 20);

    if(this.dmp?.dataDescription !== undefined && this.dmp?.dataDescription !== null){
      this.DMP_PDF.printTextField("",this.dmp?.dataDescription);
    }

    // Select categories of the data that will be generated
    if(this.dmp?.dataCategories !== undefined){
      let tblHeaders = ["Categories of the data that will be generated"];
      let tblData:Array<Array<string>>=[];
      for ( let i=0; i < this.dmp.dataCategories.length; i++){
        tblData.push([this.dmp.dataCategories[i]])
      }
      this.DMP_PDF.printTable("", tblHeaders, tblData);
    }

    // ======================== Data Preservation and Accessibility ==========================

    this.DMP_PDF.printHeader("Data Preservation and Accessibility", 0.05, "#d5d8dc", 20);

    // file path(s) / URL(s) for where data will be saved

    if(this.dmp?.pathsURLs !== undefined){
      let tblHeaders = ["File path(s) / URL(s) for where data will be saved"];
      let tblData:Array<Array<string>>=[];
      for ( let i=0; i < this.dmp.pathsURLs.length; i++){
        tblData.push([this.dmp.pathsURLs[i]])
      }
      this.DMP_PDF.printTable("", tblHeaders, tblData);
    }

    // Preservation Description
    if (this.dmp?.preservationDescription !== undefined && this.dmp?.preservationDescription !== null){
      this.DMP_PDF.printTextField("Preservation Description", this.dmp?.preservationDescription);
    }

    // Describe your plans for making the data discoverable (findable) and accessible
    if (this.dmp?.dataAccess !== undefined && this.dmp?.dataAccess !== null){
      this.DMP_PDF.printTextField("Data discoverablity and accessiblity plan", this.dmp?.dataAccess);
    }



    
    
    this.DMP_PDF.exportAsPDF();
  }
  /*

  generatePdf() {

    let myTableHeight = 0;
    autoTable(pdf,{html:'#dmpOrganizations', startY:verticalOffset, didDrawPage: function(data:any) {
      myTableHeight = data.cursor.y;
    }})

    console.log(verticalOffset);
    verticalOffset += ( myTableHeight + 1 + margin ) * (lineFontSize/ppi);
    pdf.text("END",margin,verticalOffset+(lineFontSize/ppi));
    console.log(verticalOffset);
    
    pdf.save('a4.pdf');

  }
  */
}
