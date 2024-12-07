def refr(code):
    one_liner = code.replace('\n', '\\n').replace(' ', '\\t')
    return one_liner


masters_code_li = []
with open("./masters_code.txt", "r") as my_code:
        codes = my_code.read()
        code_li = codes.split('-----')
        for code in code_li:
            sample_code = ''''''
            sample_code += code
            masters_code_li.append(sample_code)


def prompt(tester_list, master_list=masters_code_li):

    prompt = f''''''

    with open("./sample_prompt_LLM1.txt", "r") as my_file:
        prompt += my_file.read()

    tc1 = refr(tester_list[0])
    tc2 = refr(tester_list[1])
    tc3 = refr(tester_list[2])
    tc4 = refr(tester_list[3])
    tc5 = refr(tester_list[4])
    mc1 = refr(master_list[0])
    mc2 = refr(master_list[1])
    mc3 = refr(master_list[2])
    mc4 = refr(master_list[3])
    mc5 = refr(master_list[4])
    
    prompt = prompt.format(tc1=tc1, tc2=tc2, tc3=tc3, tc4=tc4, tc5=tc5, mc1=mc1, mc2=mc2, mc3=mc3, mc4=mc4, mc5=mc5)

    return prompt
