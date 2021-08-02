import { ClassField } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as M from 'materialize-css';

export interface IClassField {
  name: string;
  type: string;
  className?: string;
}

@Component({
  selector: 'app-getter-setter',
  templateUrl: './getter-setter.component.html',
  styleUrls: ['./getter-setter.component.scss']
})
export class GetterSetterComponent implements OnInit {

  outputGetterAndSetter?: string;
  outputToString?: string;
  outputUnitTest?: string;
  outputAngularCLI?: string;
  outputAngular?: string;

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  

  submit(form: any): void {
    const input: string[] = form.value.input.split('\n');
    this.outputGetterAndSetter = "";
    this.outputToString = "";
    this.outputUnitTest = "";
    this.outputAngularCLI = "";
    this.outputAngular = "";

    let className: string = input
      .filter(line => /^(public |private |protected )?(static |abstract )?class/g.test(line))
      .map(line => line.replace(/(public |private |protected )?(static |abstract )?class ([a-zA-Z]*).*/g, '$3'))[0];

    if (!className) {
      className = 'CLAZZ_NAME'
    }

    let classNameLine = 0;
    for (classNameLine = 0; classNameLine < input.length; classNameLine++) {
      if (input[classNameLine].indexOf(`class ${className}`) > -1) {
        classNameLine++;
        break;
      }
    }

    const classFields = input.slice(classNameLine)
      .filter(line => line && /^\s*/)
      .map(line => line.replace(/^\s*/, ''))
      .map(line => line.replace(/;$/, ''))
      .filter(line => !line.startsWith("@"))
      .map(line => line.replace(/static |final |private |public |protected /g, ''))
      .map(line => [line.slice(0, line.lastIndexOf(" ")), line.slice(line.lastIndexOf(" ")+1)])
      .map(line => { 
        const field = {type: line[0], name:line[1], className: className} as IClassField
        console.log("field", field)
        return field;
      }).filter(classField => classField.name && classField.type);


      if (classFields?.length) {
        classFields.forEach(classField => this.outputGetterAndSetter += this.getterAndSetter(classField) + '\n');
        this.outputToString += this.createToString(classFields);
        this.outputUnitTest += this.createUnitTest(classFields);
        this.outputAngularCLI += this.createAngularCLI(classFields[0].className);
        this.outputAngular += this.createAngular(classFields);
      }
      this.router.navigate(['./entity']);
  }

  private getterAndSetter(classField: IClassField) : string {
     const nameFirstUppercase = `${classField.name.substring(0,1).toUpperCase()}${classField.name.substring(1)}`;
    return `
public ${classField.type} get${nameFirstUppercase}() {
  return ${classField.name};
}

public void set${nameFirstUppercase}(${classField.type} ${classField.name}) {
  this.${classField.name} = ${classField.name};
}

public ${classField.className} ${classField.name}(${classField.type} ${classField.name}) {
  this.set${nameFirstUppercase}(${classField.name});
  return this;
}`;
  }

  
  private createToString(classFields: IClassField[]) : string {
   const className = classFields[0]?.className;
    let genetated = `
public String toString() {
  return "${className}: {" +`;
   classFields.forEach((classField, index) =>{ 
    const nameFirstUppercase = `${classField.name.substring(0,1).toUpperCase()}${classField.name.substring(1)}`;
    genetated += 
`
    "${index>0?', ':''}${classField.name}=" + get${nameFirstUppercase}() +`})
   return genetated + `
  "}";
}   
`;
  }
  
  private createAngularCLI(className?: string) : string {
    return `
ng g module shared
ng g module domain/${className?.toLowerCase()}
ng g c domain/${className?.toLowerCase()}/${className}List
ng g c domain/${className?.toLowerCase()}/${className}Detail
ng g c domain/${className?.toLowerCase()}/${className}Edit
ng g c domain/${className?.toLowerCase()}/${className}Delete

ng g s shared/services/${className}
ng g class shared/models/${className}`
  }
  
  private createAngular(classFields: IClassField[]) : string {
    const className = classFields[0]?.className;
    let genetated = `
{
    path: '${className?.toLowerCase()}',
    loadChildren: () => import('./domain/${className?.toLowerCase()}/${className}.module')
        .then(m => m.${className}Module)
},

export interface I${className} {`;
  classFields.forEach((classField, index) => { 
    genetated += 
`
    ${classField.name}?: ${classField.type};`
  })
  genetated += `
}   
`;
genetated += `
export class ${className} implements I${className} {
    constructor(`;
  classFields.forEach((classField, index) => { 
    genetated += 
`
        public ${classField.name}?: ${classField.type},`
  })
  return genetated + `
    ) {}
}   
`;
  }

  
private createUnitTest(classFields: IClassField[]) : string {
  const className = classFields[0]?.className;

  let genetated = `
@Test
public void equalsVerifier() throws Exception {
    genericEqualsVerifier(${className}.class);
    ${className} record1 = new ${className}();
    record1.setId(1L);
    ${className} record2 = new ${className}();
    record2.setId(record1.getId());
    assertThat(record1).isEqualTo(record2);
    record2.setId(2L);
    assertThat(record1).isNotEqualTo(record2);
    record1.setId(null);
    assertThat(record1).isNotEqualTo(record2);
}

public static <T> void genericEqualsVerifier(Class<T> clazz) throws Exception {
    T domainObject1 = clazz.getConstructor().newInstance();
    assertThat(domainObject1.toString()).isNotNull();
    assertThat(domainObject1).isEqualTo(domainObject1);
    assertThat(domainObject1.hashCode()).isEqualTo(domainObject1.hashCode());
    // Test with an instance of another class
    Object testOtherObject = new Object();
    assertThat(domainObject1).isNotEqualTo(testOtherObject);
    assertThat(domainObject1).isNotEqualTo(null);
    // Test with an instance of the same class
    T domainObject2 = clazz.getConstructor().newInstance();
    assertThat(domainObject1).isNotEqualTo(domainObject2);
    // HashCodes are equals because the objects are not persisted yet
    assertThat(domainObject1.hashCode()).isEqualTo(domainObject2.hashCode());
}
  `

  classFields.forEach(classField =>{ 
    const nameFirstUppercase = `${classField.name.substring(0,1).toUpperCase()}${classField.name.substring(1)}`;
    genetated += 
`
static final ${classField.type} DEFAULT_${className?.toUpperCase()}_${classField.name.toUpperCase()} = null;`})

genetated += `

public static ${className} createEntity() {
  var entity = new ${className}()`;
  classFields.forEach(classField =>{ 
    const nameFirstUppercase = `${classField.name.substring(0,1).toUpperCase()}${classField.name.substring(1)}`;
    genetated += 
`
    .${classField.name}(DEFAULT_${className?.toUpperCase()}_${classField.name.toUpperCase()})`})
  genetated + `;

  return entity;
}   
`;

genetated += `

@Test
public void getTest() throws Exception {
    this.mockMvc.perform(
        MockMvcRequestBuilders.get("/api/${className?.toLocaleLowerCase()}"))
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.content().contentType("application/json;charset=UTF-8"))
            .andExpect(jsonPath("$.size()").value("1"))`;

classFields.forEach(classField =>{ 
  genetated += `
            .andExpect(jsonPath("$.[0].${classField.name}").value("1"))`;
});
genetated +=     `;
} `
return genetated;
  }


  copyToClipboard(text: string | undefined): void {
    if (text) {
      navigator.clipboard.writeText(text)
        .then(data => M.toast({html: "coipied to clipboard"}),
        err => M.toast({html: "coipying to clipboard failed"})
        );
    } 
  }
}
