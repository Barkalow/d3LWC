# d3LWC
**--- This is very much an early build, it works but could use many improvements and additions ---**

A Salesforce Lightning Web Component that displays D3 graphed data. Data relationships can be created between any objects with a lookup field between them.
Example:
* Account
  * Opportunity, related by AccountId field
    * Product, related by OpportunityId field
   
Currently only the Treemap is configured to use live data, the other charting types display sample data correctly but the backend is still needing built. 

There are 3 main parts to this component:
* Charting Custom Object 
* LWC itself
* Data-gathering/formatting Apex class

# Charting Object - Chart Heirarchy

This is a fairly simple object that is used to set up a charts. Each Chart Heirarchy record represents one level of a heirarchal relationship (Account -> Opportunity -> Product)

Fields:
* Name - A readable name used to designate what the data represents
* Data Value Field - The field on the bottom level object that is used for summing, in the case of treemaps. (i.e., product price)
* Filter Criteria - SOQL filter criteria to limit results on that relationship depth. (i.e., "StageName = 'Closed Won'")
* Label Field - The field on the object that will be the label for individual data points. (i.e., "Name" for Account)
* Object Name - The object that the chart heirarchy level represents.
* Related Field - The lookup field on the object that links to the parent record.
* Parent Object - A Chart Heirarchy record that represents the parent of the current level.

# Lightning Web Component

This can be dragged onto almost any page, with a handful of options for customization. 

Options:
* Chart Id - The Id of the top-level Chart Heirarchy object the graph will be generated from.
* Chart Type - The specific type of chart to be displayed in this component. 
* Color Theme - Selection of color themes the display the chart in.
* Chart Height - The height of the chart to be displayed.
* Chart Width - The width of the chart to be displayed.

# Apex Class

Apex class that formats the data to be displayed in the chart. 

It works by gathering all the Chart Heirarchy records needed for the requested chart, then all of the records that are represented by it. 
The records are then organized into levels and maps to represent the heirarchal structure before being returned as chart specific JSON. 
**As previously mentioned, only the treemap works with dynamic data at the moment, the others just return a set of sample data.**
