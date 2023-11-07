import { Component, Input, Output, OnInit } from '@angular/core';
//resources service to talk between two components
import { ResourcesService } from '../../shared/resources.service';
import { FormArray, FormBuilder, FormControl } from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from '../../types/DMP.types';
import { DataCategories } from '../../types/data-categories.type';

@Component({
  selector: 'app-data-description',
  templateUrl: './data-description.component.html',
  styleUrls: ['./data-description.component.scss']
})
export class DataDescriptionComponent implements OnInit {

  pyramid: string = '/../../assets/images/pyramid.png'
  alttext: string="Pyramid View of Data Categories"

  availableCategories:DataCategories[]=[
    { id: 0, name: 'Published Results and SRD' },
    // { id: 1, name: 'Reference' },
    // { id: 2, name: 'Resource' },
    // { id: 3, name: 'Published' },
    { id: 2, name: 'Publishable' },
    { id: 3, name: 'Working' },
    { id: 4, name: 'Derived' },

  ]

  initialCategories: string[] = [];

  dataCategoriesMap = new Map([
    ['Published Results and SRD', false],
    // ['Reference', false],
    // ['Resource', false],
    // ['Published', false],
    ['Publishable', false],
    ['Working', false],
    ['Derived', false]
  ]);

  dataDescriptionForm = this.fb.group({
    dataDescription: [''],
    dataCategories: [[]]   

  });

  @Input()
  set initialDMP_Meta(data_description: DMP_Meta) {
    
    this.initialCategories = data_description.dataCategories;

    this.dataDescriptionForm.patchValue({
      dataDescription:                data_description.dataDescription,
      dataCategories:                 data_description.dataCategories
    });
  }

  @Output()
  valueChange = defer(() =>
    this.dataDescriptionForm.valueChanges.pipe(
      startWith(this.dataDescriptionForm.value),
      map(
        (formValue): Partial<DMP_Meta> => ({
          dataDescription:    formValue.dataDescription,
          dataCategories:     formValue.dataCategories,
        })
      )
    )
  );
  
  @Output()
  formReady = of(this.dataDescriptionForm); 

  constructor(
    //resources service to talk between two components 
    // (DataDescriptionComponent and ResourceOptionsComponent)
    private sharedService: ResourcesService,
    private fb: FormBuilder
  ) { }

  resetCheckboxes(){
    
    for (let category of this.dataCategoriesMap) {
      // Fire off events to uncheck all checkboxes in Data Description part of the form
      // and send message to highlight correct options in the Storage panel
      this.setStorageTier(category[0],false);

    }
  }

  ngOnInit(): void {   
    for (let category of this.initialCategories) {
      // Fire off events to check selected checkboxes in Data Description part of the form
      // and send message to highlight correct options in the Storage panel
      this.setStorageTier(category,true);
    }
  }

  /**
   * This function implements logic of creating storage tiers based on users selection of 
   * categories of the data that will be generated by a DMP. This is based on the selection
   * of checkboxes in the "Data Description" section of DMP user interface.
   * It also fires off messages to resource options to correctly highlight suggestions
   * in the "Storage" section of the resources panel.
   * @param category 
   * @param checked 
   */

  setStorageTier(category:string,checked:boolean){
    var storageTier: string = "";
    this.dataCategoriesMap.set(category,checked)

    // Go through possibilities with tiers based on check box selections
    for (let entry of this.dataCategoriesMap.entries()){
      if (entry[0] === "Published Results and SRD" || entry[0] === "Reference" || entry[0] === "Resource" ){
        if(entry[1]){
            storageTier = "top";
            break;
        }
      }
      else if (entry[0] === "Published" || entry[0] === "Publishable" ){
        if(entry[1]){
            storageTier = "mid";
            break;
        }
      }
      else if (entry[0] === "Working" || entry[0] === "Derived" ){
        if(entry[1]){
            storageTier = "low";
            break;
        }
      }
    }   
    
    this.sharedService.setStorageMessage(storageTier);
    this.sharedService.storageSubject$.next(storageTier);

    // since data categories check boxes take presidence over estimated data size option in 
    // technical requirements module, make sure to send apropriate message to the technical
    // requirements module
    if (storageTier === ""){
      // if not check boxes are selected send false to indicate that storage resources should
      // be highlighted according to estimated data size settings
      this.sharedService.setDataCategories(false);
      this.sharedService.dataCategories$.next(false);
    }
    else{
      // if any of the boxes are selected send true to indicate that technical requirements module
      // should not be sending any messages to the resource options component
      this.sharedService.setDataCategories(true);
      this.sharedService.dataCategories$.next(true);
    }

  }

  dataCategoryChange(e:any) {
    this.setStorageTier(e.target.defaultValue,e.target.checked);
    
    
    let dataCategories = this.dataDescriptionForm.value['dataCategories'] as string[];

    if (e.target.checked){      
      dataCategories.push(e.target.defaultValue);
    }
    else{
      dataCategories.forEach((value,index)=>{
        if(value === e.target.defaultValue) 
          dataCategories.splice(index,1)
        });
    }

  }

}