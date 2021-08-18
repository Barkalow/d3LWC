public class d3Chart{
    String returnJSON;
    Map<Id, Chart_Heirarchy__c> schemaMap;
    Map<Id, List<Chart_Heirarchy__c>> schemaChildMap;
    Map<String, List<sObject>> recordChildMap;
    Boolean instatiated = false;
    
    public d3Chart(){
        List<chartObj> topCharts = new List<chartObj>();
        schemaMap = new Map<Id, Chart_Heirarchy__c>();
        schemaChildMap = new Map<Id, List<Chart_Heirarchy__c>>();
        recordChildMap = new Map<String, List<sObject>>();
        returnJSON = '';
        instatiated = true;
    }

/*
    -:: Method Description ::-
    Usage - constructor used to create a new entire chart from a top level parent schema

    parentSchema - the Chart_Heirarchy__c object that represents the top level of the chart heirarchy
*/
    public d3Chart(Chart_Heirarchy__c parentSchema){
        List<chartObj> topCharts = new List<chartObj>();
        schemaMap = new Map<Id, Chart_Heirarchy__c>();
        schemaChildMap = new Map<Id, List<Chart_Heirarchy__c>>();
        recordChildMap = new Map<String, List<sObject>>();
        returnJSON = '';
        instatiated = true;

        createChartFromSchema(parentSchema);
    }

    public String createChartFromSchema(Chart_Heirarchy__c parentSchema){
        if(instatiated = false){
            List<chartObj> topCharts = new List<chartObj>();
            schemaMap = new Map<Id, Chart_Heirarchy__c>();
            schemaChildMap = new Map<Id, List<Chart_Heirarchy__c>>();
            recordChildMap = new Map<String, List<sObject>>();
            returnJSON = '';
            instatiated = true;
        }

        List<chartObj> topCharts = new List<chartObj>();
        Set<Id> parentIds = new Set<Id>();
        parentIds.add(parentSchema.Id);
        createSchemaMap(parentIds);

        String query = getRecordQuery(parentSchema);
        System.debug('createChartFromSchema => getRecordQuery: ' + query);
        List<sObject> topList = new List<sObject>();
        topList = Database.query(query);
        for(sObject s : topList)
            schemaMap.put((Id) s.get('Id'), parentSchema);

        Set<Id> topIds = new Set<Id>(new Map<Id, sObject>(topList).keySet());

        List<Chart_Heirarchy__c> cl = schemaChildMap.get(parentSchema.Id); 

        for(Chart_Heirarchy__c ch : cl){
            createRecordLevelMap(ch, -1, topIds);
        } 

        //Cycles through the top level records and kicks off the recursion to generate all child chart objects
        for(sObject record : topList){
            //More verbose steps for easier following/readability
            Chart_Heirarchy__c thisSchema = schemaMap.get((Id) record.get('Id'));
            String labelField = thisSchema.Label_Field__c ;
            String valueField = thisSchema.Data_Value_Field__c;

            chartObj co = new chartObj();
            co.Name = (String) record.get(labelField);
            if(valueField != null && valueField != '' && String.valueOf(record.get(valueField)) != null && String.valueOf(record.get(valueField)) != '')
                co.Value = String.valueOf(record.get(valueField));

            List<chartObj> children = getChildren(-1, (Id) record.get('Id'));

            if(children != null)
                co.setChildren(children);

            topCharts.add(co);
        }

        //At this point, topCharts is a list of chartObj and all their children, which in turn have a list of all their children, etc,etc
        createChartJSON(topCharts, true);

        return getChartJSON();
    }

    @AuraEnabled(cacheable=true)
    public static String createLWCChart(Id parentSchemaId){
        Chart_Heirarchy__c parentSchema = [SELECT Id, Name, Filter_Criteria__c, Object_Name__c, Label_Field__c, Data_Value_Field__c, Related_Field__c, Parent_Object__c FROM Chart_Heirarchy__c WHERE Id = :parentSchemaId];
        d3Chart chart = new d3Chart(parentSchema);        

        String s = '{"name" : "' + parentSchema.Name + '","children" :' + chart.getChartJSON() + '}';
        System.debug('createLWCChart:s: ' + s);
        return s;
    }

    public void createChartJSON(List<chartObj> parentList, Boolean suppressNulls){
        //animated treemap: 
        //js += '{ "name": "Total", "children": '
        //String s = '}'
        String js = JSON.serializePretty(parentList, suppressNulls);
        setChartJSON(js);
    }

    public void setChartJSON(String inJSON){
        returnJSON = inJSON;
    }

    public String getChartJSON(){
        return returnJSON;
    }

    public void createSchemaMap(Set<Id> parentIds){
        /*
        List<Chart_Heirarchy__c> children = new List<Chart_Heirarchy__c>();
        children = [SELECT Id, Filter_Criteria__c, Label_Field__c, Data_Value_Field__c, Related_Field__c FROM Chart_Heirarchy__c WHERE Parent_Object__c = :parentSchema.Id];
        
        if(children != null && children.size() > 0)
            schemaChildMap.put(parentSchema.Id, children);
        
        for(Chart_Heirarchy__c ch : children){
            createSchemaMap(ch);
        }
        */

        List<Chart_Heirarchy__c> children = new List<Chart_Heirarchy__c>();
        children = [SELECT Id, Name, Filter_Criteria__c, Object_Name__c, Label_Field__c, Data_Value_Field__c, Related_Field__c, Parent_Object__c FROM Chart_Heirarchy__c WHERE Parent_Object__c IN :parentIds];

        if(children != null && children.size() > 0){
            System.debug('createSchemaMap => children not null');
            for(Id pId : parentIds){
                List<Chart_Heirarchy__c> cl = new List<Chart_Heirarchy__c>();
                for(Integer i = 0; i < children.size(); i++){
                    Chart_Heirarchy__c ch = children[i];
                    if(ch.Parent_Object__c == pId){
                        System.debug('ch.Parent_Object__c == pId');
                        System.debug('ch: ' + ch);
                        System.debug('added to: ' + pId);
                        cl.add(ch);
                    }
                }
    
                if(cl != null && cl.size() > 0)
                    schemaChildMap.put(pId, cl);
            }
            
            Set<Id> cIds = new Set<Id>(new Map<Id, Chart_Heirarchy__c>(children).keySet());
            System.debug('cIds size: ' + cIds.size());

            createSchemaMap(cIds);
        }
    }

    public void createRecordLevelMap(Chart_Heirarchy__c levelSchema, Integer level, Set<Id> parentIds){
        List<sObject> t = new List<sObject>();
        System.debug('createRecordLevelMap before level: ' + level);
        level = level + 1;
        System.debug('createRecordLevelMap after level: ' + level);

        String query = getRecordQuery(levelSchema);
        System.debug('createRecordLevelMap => query: ' + query);
        t = Database.query(query);
        System.debug('createRecordLevelMap => t size: ' + t.size());

        for(sObject s : t)
            System.debug('createRecordLevelMap => s: ' + s);
        
        for(sObject s : t){
            //Limits scope to children of that level in the off chance of a parent showing up further in the heirarchy causing map duplicates. '|' used in case it ever needs to be split
            String levelId = level + '|' + s.get(levelSchema.Related_Field__c);
            List<sObject> cl;

            if(!recordChildMap.containsKey(levelId)){
                System.debug('createRecordLevelMap => recordChildMap not exist: ' + levelId);
                System.debug('createRecordLevelMap => recordChildMap not exist add s: ' + (String) s.get(levelSchema.Label_Field__c));
                cl = new List<sObject>();
                cl.add(s);
                recordChildMap.put(levelId,cl);
            }else{
                System.debug('createRecordLevelMap => recordChildMap exist: ' + levelId);
                System.debug('createRecordLevelMap => recordChildMap exist add s: ' + (String) s.get(levelSchema.Label_Field__c));
                cl = recordChildMap.get(levelId);
                cl.add(s);
            }

            schemaMap.put((Id) s.get('Id'), levelSchema);
            System.debug('createRecordLevelMap => schemaMap.put id: ' + (Id) s.get('Id'));
            System.debug('createRecordLevelMap => schemaMap.put schema: ' + levelSchema);
        }   
        
        Set<Id> cIds = new Set<Id>(new Map<Id,SObject>(t).keySet());
        List<Chart_Heirarchy__c> cl = schemaChildMap.get(levelSchema.Id); 

        if(cl != null && cl.size() > 0){
            System.debug('createRecordLevelMap => cIds size(): ' + cIds.size());
            for(Chart_Heirarchy__c ch : cl){
                System.debug('createRecordLevelMap => cl: ' + ch.Name);
                System.debug('createRecordLevelMap => level: ' + level);
                createRecordLevelMap(ch, level, cIds);
            }
        }        
    }

    public List<chartObj> getChildren(Integer level, Id parentId){
        List<chartObj> children = new List<chartObj>();
        //Retrieving children, not current level
        level = level + 1; 
        //Limits scope to children of that level, in the off chance of a parent showing up further in the heirarchy
        String levelId = level + '|' + parentId;

        if(recordChildMap.containsKey(levelId)){
            List<sObject> thisLevel = recordChildMap.get(levelId);
            for(Integer i = 0; i < thisLevel.size(); i++){
                sObject record = thisLevel[i];
                Chart_Heirarchy__c thisSchema = schemaMap.get(record.Id);

                if(record.get(thisSchema.Related_Field__c) == parentId){
                    String labelField = thisSchema.Label_Field__c;
                    String valueField = thisSchema.Data_Value_Field__c;

                    chartObj co = new chartObj();
                    co.Name = (String) record.get(labelField);
                    if(valueField != null && valueField != '' && String.valueOf(record.get(valueField)) != null && String.valueOf(record.get(valueField)) != '')
                        co.Value = String.valueOf(record.get(valueField));

                    List<chartObj> cco = getChildren(level, (Id) record.get('Id'));
                    
                    if(cco != null)
                        co.setChildren(cco);

                    children.add(co);
                }
            }
        }

        if(children.size() > 0){
            return children;
        }

        return null;
    }

    public String getRecordQuery(Chart_Heirarchy__c ch){
        String query = 'SELECT Id,' + ch.Label_Field__c;
        if(ch.Related_Field__c != null && ch.Related_Field__c != '')
            query += ',' + ch.Related_Field__c;

        if(ch.Data_Value_Field__c != null && ch.Data_Value_Field__c != '')
            query += ',' + ch.Data_Value_Field__c;

        query += ' FROM ' + ch.Object_Name__c;
        
        if(ch.Related_Field__c != null && ch.Related_Field__c != '')
            query += ' WHERE ' + ch.Related_Field__c + ' IN :parentIds';

        if(ch.Filter_Criteria__c != null && ch.Filter_Criteria__c != ''){
            if(ch.Related_Field__c != null && ch.Related_Field__c != ''){
                query += 'AND ' + ch.Filter_Criteria__c;
            }else{
                query += ' WHERE ' + ch.Filter_Criteria__c;
            }
        }
        
        return query;
    }

    /*  Note: not currently used, left in case of future necessity
        -:: Method Description ::-
        Usage - returns a SOQL query String of editable or all fields with a given filter criteria

        Object name - the developer name of the object being queried
        whereClause - the filter criteria for queried records
        extraRelatedFields - any fields from related records that need to be included (i.e., Invoice__r.Company__c)
        writeableOnly - whether to get all fields or only editable fields
    */
    public String getCreatableFieldsSOQL(String objectName, String whereClause, String extraRelatedFields, Boolean writeableOnly){
        String selects = '';

        if (whereClause == null || whereClause == ''){
            return null;
        }        

        // Get a map of field name and field token
        Map<String, Schema.SObjectField> fMap = Schema.getGlobalDescribe().get(objectName.toLowerCase()).getDescribe().Fields.getMap();

        list<String> selectFields = new list<String>();        

        if (fMap != null){
            //loop through all field tokens (ft)
            for (Schema.SObjectField ft : fMap.values()){ 
                //describe each field (fd)            	
                Schema.DescribeFieldResult fd = ft.getDescribe(); 
                //System.debug('FieldName: ' + fd.getName());
                if(writeableOnly && fd.isCreateable()){
                    selectFields.add(fd.getName());
                }else if(!writeableOnly){
                    selectFields.add(fd.getName());
                }
            }
        }        

        if (!selectFields.isEmpty()){
            for (string s:selectFields){
                selects += s + ',';
            }

            if (selects.endsWith(',')){
                selects = selects.substring(0,selects.lastIndexOf(','));
            }     
        }        

        if(extraRelatedFields != null && extraRelatedFields.length() > 1)        
            return 'SELECT ' + selects + ', ' + extraRelatedFields + ' FROM ' + objectName + ' WHERE ' + whereClause;   
        else
            return 'SELECT ' + selects + ' FROM ' + objectName + ' WHERE ' + whereClause;
    }

    public class chartObj{
        public String name;
        public String value;
        public List<chartObj> children;

        public chartObj(){
            //children = new List<chartObj>();
        }

        public chartObj(String n, String v){
            if(n != null)
            	name = n;
            
            if(v != null)
            	value = v;

            children = new List<chartObj>();
        }

        public chartObj(String n, String v, List<chartObj> c){
            if(n != null)
            	name = n;
            
            if(v != null)
            	value = v;
            
            children = new List<chartObj>();
            children.addAll(c);
        }

        public void setChildren(List<chartObj> c){
            children = new List<chartObj>();
            children.addAll(c);
        }
    }
}