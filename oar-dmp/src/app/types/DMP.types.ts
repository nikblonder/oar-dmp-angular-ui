import { BasicInfo } from "./basic-info.type";
import { Keywords } from "./keywords.type";
import { TechnicalRequirements } from "./technical-requirements.type";
import { EthicalIssues } from "./ethical-issues.type";
import { DataDescription } from "./data-description.type";
import { DataPreservation } from "./data-preservation.type";
export interface DMP_Meta extends BasicInfo, Keywords, TechnicalRequirements, EthicalIssues, DataDescription, DataPreservation{
  
}